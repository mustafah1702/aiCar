class Road {
    constructor() {
        // Blockage lines that can be placed anywhere
        this.blockageLines = [];
        this.startPoint = null;
        this.endPoint = null;
    }

    // Add a blockage line
    addBlockageLine(x1, y1, x2, y2) {
        this.blockageLines.push({x1, y1, x2, y2});
    }

    // Set the start point
    setStartPoint(x, y) {
        this.startPoint = {x, y};
    }

    // Set the end point
    setEndPoint(x, y) {
        this.endPoint = {x, y};
    }

    // Draw the road on the canvas
    draw(ctx) {
        // Draw blockage lines
        ctx.strokeStyle = '#e74c3c'; // Red color for blockage lines
        ctx.lineWidth = 3;

        this.blockageLines.forEach(line => {
            ctx.beginPath();
            ctx.moveTo(line.x1, line.y1);
            ctx.lineTo(line.x2, line.y2);
            ctx.stroke();
        });

        // Draw start point
        if (this.startPoint) {
            ctx.fillStyle = '#2ecc71';
            ctx.beginPath();
            ctx.arc(this.startPoint.x, this.startPoint.y, 5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw end point
        if (this.endPoint) {
            ctx.fillStyle = '#e74c3c';
            ctx.beginPath();
            ctx.arc(this.endPoint.x, this.endPoint.y, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Get distance to blockage from a point in a given direction
    getDistanceToBlockage(x, y, angle) {
        const maxDistance = 200;
        const step = 1;
        let distance = 0;

        while (distance < maxDistance) {
            const checkX = x + Math.cos(angle) * distance;
            const checkY = y + Math.sin(angle) * distance;

            if (this.isPointOnBlockage(checkX, checkY)) {
                return distance;
            }

            distance += step;
        }

        return maxDistance;
    }

    // Check if a point is on or near a blockage line
    isPointOnBlockage(x, y) {
        const margin = 5; // Margin for collision detection

        for (let i = 0; i < this.blockageLines.length; i++) {
            const line = this.blockageLines[i];
            if (this.distanceToLine(x, y, line.x1, line.y1, line.x2, line.y2) < margin) {
                return true;
            }
        }

        return false;
    }

    // Calculate distance from a point to a line segment
    distanceToLine(x, y, x1, y1, x2, y2) {
        const A = x - x1;
        const B = y - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const len_sq = C * C + D * D;
        let param = -1;

        if (len_sq !== 0) {
            param = dot / len_sq;
        }

        let xx, yy;

        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        const dx = x - xx;
        const dy = y - yy;

        return Math.sqrt(dx * dx + dy * dy);
    }

    // Clear all road data
    clear() {
        this.blockageLines = [];
        this.startPoint = null;
        this.endPoint = null;
    }
} 