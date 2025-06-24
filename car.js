class Car {
    constructor(x, y) {
        // Car properties
        this.x = x;
        this.y = y;
        this.angle = 0; // Angle in radians
        this.speed = 0;
        this.maxSpeed = 4;
        this.acceleration = 0.2;
        this.turnSpeed = 0.1;
        this.width = 30;
        this.height = 15;
        
        // Sensor properties
        this.sensorCount = 5;
        this.sensorLength = 100;
        this.sensorAngles = [-Math.PI/2, -Math.PI/4, 0, Math.PI/4, Math.PI/2];
        this.sensorReadings = new Array(this.sensorCount).fill(0);
    }

    // Update car position and angle based on current speed and angle
    update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        
        // Normalize angle to keep it between -PI and PI
        while (this.angle > Math.PI) this.angle -= 2 * Math.PI;
        while (this.angle < -Math.PI) this.angle += 2 * Math.PI;
    }

    // Move the car forward
    moveForward() {
        this.speed = Math.min(this.speed + this.acceleration, this.maxSpeed);
        // Ensure minimum speed to prevent getting stuck
        if (this.speed < 0.1) this.speed = 0.1;
    }

    // Move the car backward
    moveBackward() {
        this.speed = Math.max(this.speed - this.acceleration, -this.maxSpeed/2);
        // Ensure minimum speed to prevent getting stuck
        if (this.speed > -0.1) this.speed = -0.1;
    }

    // Turn the car left
    turnLeft() {
        this.angle -= this.turnSpeed;
    }

    // Turn the car right
    turnRight() {
        this.angle += this.turnSpeed;
    }

    // Draw the car on the canvas
    draw(ctx) {
        console.log('Drawing car at:', this.x, this.y, 'angle:', this.angle);
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Draw car body - make it larger and bright red for visibility
        ctx.fillStyle = '#ff0000'; // Bright red
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        
        // Draw car direction indicator
        // ctx.fillStyle = '#27ae60';
        // ctx.beginPath();
        // ctx.moveTo(this.width/2, 0);
        // ctx.lineTo(this.width/2 - 5, -5);
        // ctx.lineTo(this.width/2 - 5, 5);
        // ctx.fill();
        
        ctx.restore();
        
        // Debug: Draw a circle at car's position to verify location
        ctx.fillStyle = '#0000ff'; // Blue circle
        ctx.beginPath();
        ctx.arc(this.x, this.y, 10, 0, Math.PI * 2); // Increased radius from 5 to 10
        ctx.fill();
        
        // Draw sensors
        this.drawSensors(ctx);
    }

    // Draw sensor rays
    drawSensors(ctx) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        
        for (let i = 0; i < this.sensorCount; i++) {
            const angle = this.angle + this.sensorAngles[i];
            const endX = this.x + Math.cos(angle) * this.sensorReadings[i];
            const endY = this.y + Math.sin(angle) * this.sensorReadings[i];
            
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }
        
        ctx.restore();
    }

    // Get sensor readings based on road blockages
    sense(road) {
        for (let i = 0; i < this.sensorCount; i++) {
            const angle = this.angle + this.sensorAngles[i];
            this.sensorReadings[i] = road.getDistanceToBlockage(this.x, this.y, angle);
        }
        return this.sensorReadings;
    }

    // Reset car to initial position
    reset(x, y) {
        this.x = x;
        this.y = y;
        this.angle = 0;
        this.speed = 0;
    }
} 