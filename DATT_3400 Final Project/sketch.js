/*
  4 Seasons
  By Santiago Bucio-Cano
  DATT 3400

  This sketch generates a dynamic 3D cityscape, complete with buildings, roads, and moving cars.
  The city responds to the bass, mid, and treble frequencies of the music, with buildings' heights 
  and road colors changing based on the music. Additionally, seasonal effects like rain, snow, 
  falling leaves, and blooming flowers are applied depending on the selected season. 
  The camera allows the user to zoom and rotate around the scene for an immersive experience.
  As the music plays, the cars move faster or slower based on the loudness of the sound.
  
  Sound file: "Voodoo Child.mp3"
  Car model: "PG2.79.obj"
  Building texture: "BuildingsHighRise.jpg"
  Road texture: "blackRoadTexture.avif"
*/
let fft, soundFile;
let buildings = [];
let cars = []; // Array to store cars
let zoomLevel = 400;
let minZoom = 200;
let maxZoom = 1900;
let cameraRotation = { x: 0, y: 0 };
let roadHeight = 10; // Height for roads
let roads = []; // Array to store the road paths
let buildingTexture;
let roadTexture;
let carModel;
let currentSeason = 'spring';  // Default season
let particles = []; // Array to store all the particles
let audioFileInput;  // The file input for uploading audio
let prevMouseX, prevMouseY;
let cameraPosition = { x: 0, y: 500, z: 400 };

function preload() {
  // Load default sound (you can remove this if you want no default sound)
  soundFile = loadSound('Voodoo Child.mp3');
  buildingTexture = loadImage('BuildingsHighRise.jpg');
  carModel = loadModel('PG2.79.obj', true);  // true enables automatic scaling of the model
  roadTexture = loadImage('blackRoadTexture.avif');
  
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  background(0);
  

  // Set up FFT for frequency analysis
  fft = new p5.FFT();
  
 // Start audio only on user interaction
  let playButton = createButton("Play Audio");
  playButton.position(10, 10);
  playButton.mousePressed(startAudio);

  
  // Set up camera position
  camera(200, 800, zoomLevel, 0, 0, 0, 0, 0, 0);

  // Predefined city map
  createCityMap();

  // Create roads between the buildings
  createRoads();

  // Create cars and set their paths
  for (let i = 0; i < 20; i++) { // Create 20 cars
    let car = new Car(random(-200, 200), random(-200, 200)); // Random starting positions
    car.setPath(roads); // Set the car's path based on roads
    cars.push(car);
  }

  // Create UI buttons to change season
  let seasonSelector = QuickSettings.create(10, height / 2, 'Season Selector');
  seasonSelector.addButton('Spring', () => changeSeason('spring'));
  seasonSelector.addButton('Summer', () => changeSeason('summer'));
  seasonSelector.addButton('Fall', () => changeSeason('fall'));
  seasonSelector.addButton('Winter', () => changeSeason('winter'));
  
  moveCamera();
}

  

function startAudio() {
  if (!soundFile.isPlaying()) {
    soundFile.loop();
  }
}

function draw() {

  // Perform frequency analysis for dynamic city interaction
  let spectrum = fft.analyze();
  let bass = fft.getEnergy("bass");
  let mid = fft.getEnergy("mid");  // Mid-range frequencies (for vocals)
  let treble = fft.getEnergy("treble");
  
  // Apply seasonal changes to the environment (light, ambient color, etc.)
  applySeason(currentSeason);

  // Update and display particles (like snow, rain, etc.)
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].show();
    if (particles[i].isOffScreen()) {
      particles.splice(i, 1); // Remove particle if off-screen
    }
  }
  

  // Update buildings based on bass frequencies
  updateBuildings(bass, spectrum);

  // Update roads based on bass and treble frequencies
  updateRoads(bass, treble);  // Update road colors based on music

  // Manipulate camera with mouse control (rotate)
  mouseControl();

  // Apply the updated zoom level to the camera without moving the city
  camera(zoomLevel * cos(cameraRotation.y) * cos(cameraRotation.x),
         zoomLevel * sin(cameraRotation.x),
         zoomLevel * sin(cameraRotation.y) * cos(cameraRotation.x),
         0, 0, 0,
         0, -1, 0);

  // Draw the roads and the city
  drawRoads();
  drawCity(); // Uncomment if you want to display buildings too

  // Update and draw cars with treble influencing the movement speed

  for (let i = 0; i < cars.length; i++) {
    // Pass treble, bass, and mid to the car's update function
    cars[i].update(bass, mid, treble);  // Make sure all three   parameters are being passed
    cars[i].show();
  }


 
}

// Predefined city map: define building positions with random sizes
function createCityMap() {
  for (let x = -400; x < 200; x += 100) {
    for (let z = -400; z < 200; z += 100) {
      let building = new Building(x, 0, z);
      buildings.push(building);
    }
  }
}

function updateBuildings(soundLevel, spectrum) {
  let bass = fft.getEnergy("bass");
  let mid = fft.getEnergy("mid");
  let treble = fft.getEnergy("treble");

  // Get the average sound level from the FFT spectrum
  let avgEnergy = (bass + mid + treble);

  // Use the bass energy to influence the building height and width
  let bassHeightFactor = map(bass, 0, 255, 1, 4);  // Modify height based on bass
  let bassColorFactor = map(bass, 0, 255, 50, 255);  // Modify color based on bass

  for (let i = 0; i < buildings.length; i++) {
    let building = buildings[i];

    // Update building height and width based on bass
    let height = map(bass, 0, 255, building.baseHeight, building.baseHeight * bassHeightFactor);
    let width = map(mid*2, 0, 255, building.baseWidth, building.baseWidth * 1.5);
    let depth = map(treble, 0, 255, building.baseDepth, building.baseDepth * 1.5);

    building.update(height, width, depth);

    // Update building color based on bass frequency
    building.color = color(bassColorFactor, 255 - bassColorFactor, random(100, 255));  // Vibrant colors with bass
  }
}

// Function to draw the city with the buildings
function drawCity() {
  for (let i = 0; i < buildings.length; i++) {
    let building = buildings[i];
    building.show();
  }
}

function createRoads() {
  // Create roads between buildings (ensure roads fit between buildings)
  for (let x = -400; x < 200; x += 120) {
    for (let z = -400; z < 200; z += 120) {
      roads.push(createVector(x, 0, z)); // Create a road point at the intersection of the grid
    }
  }
}

function updateRoads(bass, treble) {
  // Modify the colors using bass energy to influence road color
  for (let i = 0; i < roads.length; i++) {
    let road = roads[i];
    let bassColorValue = map(bass, 0, 255, 100, 255);  // Bass energy controls road color intensity

    // Adjust the road color dynamically using bass energy (RGB channels)
    let r = map(bassColorValue, 0, 255, 50, 255);  // Red component from bass energy
    let g = map(bassColorValue, 0, 255, 0, 150);   // Green component, adjust as needed
    let b = map(bassColorValue, 0, 255, 100, 255); // Blue component, adjust as needed

    // Set the road's color dynamically based on bass frequency
    road.color = tint(r, g, b);
  }
}

function drawRoads() {
  // Draw roads
  for (let i = 0; i < roads.length; i++) {
    let road = roads[i];
    push();
    translate(road.x, -roadHeight / 2, road.z);
    texture(roadTexture); // Apply the road's texture
    noStroke();
    box(120, roadHeight, 120);
    pop();
  }
}

// Mouse control for camera rotation
function mouseControl() {
  if (mouseIsPressed) {
    let deltaX = mouseX - pmouseX;
    let deltaY = mouseY - pmouseY;

    cameraRotation.x += deltaY * 0.01;
    cameraRotation.y += deltaX * 0.01;

    camera(zoomLevel * cos(cameraRotation.y) * cos(cameraRotation.x),
           zoomLevel * sin(cameraRotation.x),
           zoomLevel * sin(cameraRotation.y) * cos(cameraRotation.x),
           0, 0, 0,
           0, -1, 0);
  }
}

// Function to handle zooming with the trackpad or mouse wheel
function mouseWheel(event) {
  // Adjust zoom level based on the scroll direction
  zoomLevel -= event.delta * 0.5; // Scale the zoom change factor for smooth zooming

  // Constrain zoom level within the range of minZoom and maxZoom
  zoomLevel = constrain(zoomLevel, minZoom, maxZoom);
  return false; // Prevent default behavior (page scrolling)
}

// Function to shuffle an array
function randomShuffle(arr) {
  let shuffled = arr.slice(); // Create a copy of the array to avoid modifying the original
  for (let i = shuffled.length - 1; i > 0; i--) {
    let j = floor(random(i + 1)); // Get a random index
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // Swap elements
  }
  return shuffled;
}

// Apply seasonal changes to the environment (light, ambient color, etc.)
function applySeason(season) {
  
  let bass = fft.getEnergy("bass");
  let mid = fft.getEnergy("mid");
  let treble = fft.getEnergy("treble");
  // Map the frequency values to control background color and ambient lighting
  let bassColorValue = map(bass, 0, 255, 100, 255);
  let midColorValue = map(mid, 0, 255, 100, 255);
  let trebleColorValue = map(treble, 0, 255, 100, 255);

  if (season === 'spring') {
    // Spring: Fresh, light green with soft lighting
    ambientLight(150, 200, 150);
    directionalLight(255, 255, 255, 1, 1, -1);  // Sunlight
    background(trebleColorValue, 255, 150);  // Light green background for spring

    // Generate rain (blue drops)
    generateRain();
    
  } else if (season === 'summer') {
    // Summer: Bright, colorful with flowers blooming
    ambientLight(255, 255, 200);
    directionalLight(255, 255, 255, 1, 1, -1);  // Strong sunlight
    background(0, midColorValue*2, 255);  // Clear blue sky background for summer

    // Generate flowers
    generateFlowers();
    
  } else if (season === 'fall') {
    // Fall: Warm, orange and brown tones
    ambientLight(200, 150, 100);
    directionalLight(255, 200, 100, 1, 1, -1);  // Soft fall sunlight
    background(255, 180, bassColorValue );  // Warm autumn background for fall

    // Generate falling leaves (orange/brown)
    generateLeaves();
    
  } else if (season === 'winter') {
    // Winter: Cool tones, bluish and snowy look
    ambientLight(180, 220, 255);
    directionalLight(255, 255, 255, 0, 1, -1);  // Cold sunlight
    background(200, midColorValue*2, 255);  // Icy blue background for winter

    // Generate snow
    generateSnow();
  }
}

// Change season when button is pressed
function changeSeason(season) {
  currentSeason = season;
  particles = []; // Clear previous particles when switching season
}

class Particle {
  constructor(x, y, z, type, soundLevel) {
    this.position = createVector(x - 220, y, z - 220);
    this.velocity = createVector(random(-1, 1), random(1, 3), random(-1, 1)); // Velocity in 3D space
    this.acceleration = createVector(0, -0.1, 0); // Gravity in the y-direction
    this.lifespan = 255;
    this.type = type;
    this.soundLevel = soundLevel;  // Store the sound level to adjust size
    this.rotationAngle = random(TWO_PI);  // Random initial rotation angle for each particle
    this.rotationSpeed = random(0.01, 0.05);  // Random rotation speed for each particle

    // Set different sizes for each particle type, influenced by the sound level
    this.size = this.calculateSize(soundLevel);
  }

  calculateSize(soundLevel) {
    // Calculate the size of the particle based on the sound level
    if (this.type === 'leaf') {
      return map(soundLevel, 0, 255, 20, 80);  // Adjusted range for larger leaves
    } else {
      return map(soundLevel, 0, 255, 5, 50);  // Default range for other particle types
    }
  }

  update() {
    this.velocity.add(this.acceleration);
    this.position.add(this.velocity);
    this.lifespan -= 1.5;

    // Dynamically update particle size based on sound level
    this.size = this.calculateSize(this.soundLevel);

    // Update rotation angle based on rotation speed
    this.rotationAngle += this.rotationSpeed;
  }

  show() {
  push();
  translate(this.position.x, this.position.y, this.position.z);

  // Apply rotation only to certain particle types (e.g., leaves and flowers)
  if (this.type === 'leaf' || this.type === 'flower') {
    // Rotate the particles based on their rotationAngle
    rotateZ(this.rotationAngle);  // Rotate around Z axis
    rotateY(this.rotationAngle);  // Additional rotation for more dynamic effects
  }

  if (this.type === 'snow') {
    fill(255, 255, 255, this.lifespan);
    noStroke();
    sphere(this.size / 2); // Snowflakes are spheres in 3D
  } else if (this.type === 'rain') {
    strokeWeight(5);
    stroke(100, 100, 255, this.lifespan);
    line(0, 0, 1, 0, this.size, 0); // 3D raindrop using line
  } else if (this.type === 'leaf') {
    fill(200, 100, 0, this.lifespan);
    beginShape();
    vertex(0, 0, 0);
    bezierVertex(-this.size / 2, -this.size / 2, this.size / 2, -this.size / 2, 0, this.size / 2); // Custom leaf shape in 3D
    endShape(CLOSE);
  } else if (this.type === 'flower') {
    fill(255, 255, 0, this.lifespan);  // Set color to yellow
    beginShape();
    vertex(0, 0, 0);  // Starting point at the center
    let innerSize = this.size * 0.8; // Increase inner radius for a bigger flower
    let outerSize = this.size * 1.5; // Increase outer radius for a bigger flower

    for (let i = 0; i < 12; i++) { // Star with 12 points (6 outer and 6 inner)
      let angle = TWO_PI / 12 * i; // Divide the circle into 12 parts
      let radius = (i % 2 === 0) ? outerSize : innerSize; // Alternate between outer and inner radius
      let x = cos(angle) * radius;
      let y = sin(angle) * radius;
      vertex(x, y, 0); // Add the calculated vertex
    }

    endShape(CLOSE); // Complete the star shape
  }

  pop();
}


  isOffScreen() {
    return (this.position.y > height || this.position.x < -width || this.position.x > width || this.position.z < -500 || this.position.z > 500);
  }
}


function generateSnow() {
  if (frameCount % 2 === 0) { // Generate snow particles more frequently
    let p = new Particle(random(-width / 2, width / 2), maxBuildingHeight + 400, random(-500, 500), 'snow', fft.getEnergy('bass'));
    particles.push(p);
  }
}

function generateRain() {
  if (frameCount % 1 === 0) { // Generate rain particles more frequently
    let p = new Particle(random(-width / 2, width / 2), maxBuildingHeight + 400, random(-500, 500), 'rain', fft.getEnergy('mid'));
    particles.push(p);
  }
}

function generateLeaves() {
  if (frameCount % 2 === 0) { // Generate leaves particles more frequently
    let p = new Particle(random(-width / 2, width / 2), maxBuildingHeight + 400, random(-500, 500), 'leaf', fft.getEnergy('treble'));
    particles.push(p);
  }
}

function generateFlowers() {
  if (frameCount % 4 === 0) { // Generate flowers less frequently
    let p = new Particle(random(-width / 2, width / 2), maxBuildingHeight + 400, random(-500, 500), 'flower', fft.getEnergy('treble'));
    particles.push(p);
  }
}

function keyPressed() {
  // Check if the arrow keys are pressed to move the camera
  if (keyCode === LEFT_ARROW) {
    cameraPosition.x -= 10; // Move left
  } else if (keyCode === RIGHT_ARROW) {
    cameraPosition.x += 10; // Move right
  } else if (keyCode === UP_ARROW) {
    cameraPosition.y -= 10; // Move up (camera moves vertically)
  } else if (keyCode === DOWN_ARROW) {
    cameraPosition.y += 10; // Move down (camera moves vertically)
  } else if (key === 'w' || key === 'W') {
    cameraPosition.z -= 10; // Move forward (zoom in)
  } else if (key === 's' || key === 'S') {
    cameraPosition.z += 10; // Move backward (zoom out)
  }
}

function moveCamera() {
  // Apply camera movement based on cameraPosition
  camera(cameraPosition.x, cameraPosition.y, cameraPosition.z, 
         0, 0, 0, 0, -1, 0);  // Maintain the camera look-at point at the center
}