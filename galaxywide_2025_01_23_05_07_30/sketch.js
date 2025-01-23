let particles = [];
let table;
let goalsAgainst = [];
let goalsFor = [];
let years = [];
let parNum = 1000; // Number of particles (stars)
let mySize;
let centerX, centerY; // Galaxy center
let rotatingStar;

function preload() {
  // Load the CSV file before setup
  table = loadTable('Teams.csv', 'csv', 'header');
  
  
}
function setup() {
  mySize = min(windowWidth, windowHeight);
  createCanvas(mySize, mySize, WEBGL); // Use WEBGL for 3D rendering
  colorMode(HSB, 360, 100, 100, 100);
  // Extract the data from the CSV
  for (let i = 0; i < table.getRowCount(); i++) {
    goalsFor.push(table.getNum(i, 'GF'));  // Goals For
    goalsAgainst.push(table.getNum(i, 'GA'));  // Goals Against
    years.push(table.getString(i, 'year'));  // Year
  }
  
  centerX = 0; // Center of the canvas (in 3D space)
  centerY = 0;

  // Initialize particles with random orbit positions and velocities, influenced by dataset
  for (let i = 0; i < parNum; i++) {
    let dataIndex = floor(map(i, 0, parNum, 0, goalsFor.length)); // Map particle index to dataset index
    particles.push(new Particle(centerX, centerY, dataIndex));
  }

  // Create the rotating star at the center of the galaxy
  rotatingStar = new RotatingStar(centerX, centerY, 50); // Place it at the center of the galaxy
  background(0, 0, 5); // Dark background for space
}

function draw() {
  background(0, 0, 5); // Dark background for space
  
  // Update and display all particles (stars)
  for (let i = 0; i < particles.length; i++) {
    particles[i].update();
    particles[i].show();
  }
  
  // Display the rotating star in the center
  rotatingStar.update();
  rotatingStar.show();
}

// Particle class to represent stars in the galaxy
class Particle {
  constructor(centerX, centerY, dataIndex) {
    this.center = createVector(centerX, centerY, 0); // Center of the galaxy (3D)
    this.angle = random(TWO_PI); // Random starting angle for orbit
    this.radius = random(50, 300); // Random radius from the center
    this.speed = map(goalsAgainst[dataIndex], 0, 100, 0.001, 0.01); // Speed influenced by goalsAgainst
    this.size = map(goalsFor[dataIndex], 0, 100, 2, 5); // Size influenced by goalsFor
    
    // Map the 'years' data to a color hue
    let year = int(years[dataIndex]);
    let yearMapped = map(year, 1900, 2025, 180, 360); // Map years from 1900 to 2025 into a hue range (cool to warm)
    this.color = color(yearMapped, 80, 80); // Color based on the year, with saturation and brightness fixed

    this.dataIndex = dataIndex; // Store the dataset index for later reference
  }

  update() {
    // Update the angle to make the particle orbit
    this.angle += this.speed; // Orbit by changing the angle over time
    
    // Using polar coordinates (radius and angle) to determine the position
    this.x = this.center.x + cos(this.angle) * this.radius;
    this.y = this.center.y + sin(this.angle) * this.radius;
    this.z = sin(this.angle) * 50; // Adding a slight 3D effect to make it look more dynamic
    
    // Optionally, add some random movement for a more chaotic effect
    this.x += random(-1, 1);
    this.y += random(-1, 1);
  }

  show() {
    noStroke();
    fill(this.color);
    ellipse(this.x, this.y, this.size, this.size); // Draw the star
  }
}

// 3D Rotating Custom Star class to represent the rotating star at the center of the galaxy
class RotatingStar {
  constructor(x, y, size) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.angleX = 0; // Initial rotation angle around the X axis
    this.angleY = 0; // Initial rotation angle around the Y axis
    this.angleZ = 0; // Initial rotation angle around the Z axis
    this.rotationSpeed = 0.05; // Speed of rotation
  }

  update() {
    // Update the rotation angles for 3D rotation
    this.angleX += this.rotationSpeed;
    this.angleY += this.rotationSpeed;
    this.angleZ += this.rotationSpeed;
  }

  show() {
    push(); // Save the current drawing state
    
    translate(this.x, this.y); // Move the origin to the center of the rotating star
    
    // Apply 3D rotations around the X, Y, and Z axes
    rotateX(this.angleX);
    rotateY(this.angleY);
    rotateZ(this.angleZ);
    
    // Draw the rotating custom star (3D)
    fill(60, 100, 100); // Use a color for the rotating star
    noStroke();

    // Custom 3D Star Shape
    star(0, 0, this.size, this.size * 1.5, 5); // Use the custom star function here

    pop(); // Restore the drawing state
  }
}

// Custom 3D Star Function (With alternating radii for spikes and Z-axis extrusion)
function star(x, y, radius1, radius2, npoints) {
  let angle = TWO_PI / npoints;
  let halfAngle = angle / 2.0;
  beginShape();
  for (let a = 0; a < TWO_PI; a += angle) {
    // Outer points (extruded into the Z axis)
    let sx = x + cos(a) * radius2;
    let sy = y + sin(a) * radius2;
    let sz = sin(a) * 20; // Adding Z depth to the outer points
    vertex(sx, sy, sz);
    
    // Inner points (extruded into the Z axis)
    sx = x + cos(a + halfAngle) * radius1;
    sy = y + sin(a + halfAngle) * radius1;
    sz = cos(a + halfAngle) * 20; // Adding Z depth to the inner points
    vertex(sx, sy, sz);
  }
  endShape(CLOSE);
}
