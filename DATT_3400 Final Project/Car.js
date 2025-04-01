class Car {
  constructor(x, z) {
    this.x = x; // Starting x position (fixed)
    this.z = z; // Starting z position
    this.color = color(random(255), random(255), random(255)); // Random color for the car
    this.baseSpeed = 1;  // Base speed for the car
    this.speed = this.baseSpeed;  // Speed will be dynamically changed by music loudness
    this.path = [];  // Array of road points to follow (only along z-axis)
    this.pathIndex = 0;  // To track the current road point
    this.size = random(10, 20); // Random car size (can be used for scaling)
    this.scaleFactor = 0.25; // Random scale factor between 0.5 and 1.5
  }

  setPath(path) {
    this.path = path;  // Assign the full road path
    this.pathIndex = floor(random(path.length)); // Randomly assign starting position
  }

  update(bass, mid, treble) {
    if (this.path.length > 0) {
      let target = this.path[this.pathIndex];

      // Calculate the total loudness by averaging bass, mid, and treble
      let loudness = (bass + mid + treble) / 3; // Averaging bass, mid, and treble to get a loudness measure

      // Map the loudness to a speed range. If it's louder, the car goes faster.
      let targetSpeed = map(loudness, 0, 255, this.baseSpeed, this.baseSpeed * 5); // Speed influenced by loudness

      // Smoothly transition speed based on loudness
      this.speed = lerp(this.speed, targetSpeed, 0.1);  // Smooth transition for speed

      // Move the car along the z-axis to the next target point
      let moveDirection = target.z - this.z; // Only move on the z-axis
      let movement = moveDirection > 0 ? this.speed : -this.speed; // Determine direction based on the target

      this.z += movement;  // Update z position

      // If the car reaches the next road point, move to the next point
      if (abs(this.z - target.z) < 5) {
        this.pathIndex = (this.pathIndex + 1) % this.path.length;  // Loop back to the first road point when reaching the end
      }
    }
  }

  show() {
    push();
    translate(this.x-125, roadHeight / 2, this.z); // Position on road height (only x and z coordinates)

    // Calculate the angle for rotation based on the movement direction
    let target = this.path[this.pathIndex];
    let angle = atan2(target.z - this.z, 0); // Get the angle based on z-axis movement

    // Prevent the flipping issue by rotating along the y-axis (most cars rotate around y-axis)
    rotateY(angle-HALF_PI);  // Rotate the car around the Y-axis

    fill(this.color); // Apply color filter to the model
    strokeWeight(0.025);

    // Apply scale factor to the model
    scale(this.scaleFactor);

    model(carModel);  // Draw the car model
    pop();
  }
}
