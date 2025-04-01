
class Building {
  constructor(x, y, z) {
    this.x = x;
    this.y = 0; // Ground level
    this.z = z;

    // Random base size for each building at creation
    this.baseWidth = 40;  
    this.baseHeight = random(50, 200); 
    this.baseDepth = 50;   

    this.color = color(random(255), random(255), random(255)); // Random color
    this.texture = buildingTexture; // Use the loaded texture

    // Set the initial size of the building
    this.width = this.baseWidth;
    this.height = this.baseHeight;
    this.depth = this.baseDepth;
  }

  // Update the building's size and height based on sound levels
  update(height, width, depth) {
    this.height = height;
    this.width = width;
    this.depth = depth;
  }

  // Display the building
  show() {
    push();
    translate(this.x, this.y + this.height / 2, this.z); // Position at center

   
    texture(this.texture); // Apply texture if it's loaded
  
    tint(this.color); // Fallback color if no texture
  

    stroke(0);
    //noStroke();
    box(this.width, this.height, this.depth); // Draw box with or without texture
    pop();
  }
}

let maxBuildingHeight = 150; // Variable to hold the maximum building height

// Update function to track maximum height
function updateMaxBuildingHeight() {
  for (let i = 0; i < buildings.length; i++) {
    maxBuildingHeight = max(maxBuildingHeight, buildings[i].height);
  }
}
