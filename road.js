class Road {
    constructor() {
        // Road boundaries (left and right)
        this.leftBoundary = [];
        this.rightBoundary = [];
        this.startPoint = null;
        this.endPoint = null;
    }

    // Add a point to the left boundary
    addLeftPoint(x, y) {
        this.leftBoundary.push({x, y});
    }

    // Add a point to the right boundary
    addRightPoint(x, y) {
        this.rightBoundary.push({x, y});
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
        // Draw boundaries
        ctx.strokeStyle = '#34495e';
        ctx.lineWidth = 2;

        // Draw left boundary
        if (this.leftBoundary.length > 1) {
            ctx.beginPath();
            ctx.moveTo(this.leftBoundary[0].x, this.leftBoundary[0].y);
            for (let i = 1; i < this.leftBoundary.length; i++) {
                ctx.lineTo(this.leftBoundary[i].x, this.leftBoundary[i].y);
            }
            ctx.stroke();
        }

        // Draw right boundary
        if (this.rightBoundary.length > 1) {
            ctx.beginPath();
            ctx.moveTo(this.rightBoundary[0].x, this.rightBoundary[0].y);
            for (let i = 1; i < this.rightBoundary.length; i++) {
                ctx.lineTo(this.rightBoundary[i].x, this.rightBoundary[i].y);
            }
            ctx.stroke();
        }

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

    // Get distance to boundary from a point in a given direction
    getDistanceToBoundary(x, y, angle) {
        const maxDistance = 200;
        const step = 1;
        let distance = 0;

        while (distance < maxDistance) {
            const checkX = x + Math.cos(angle) * distance;
            const checkY = y + Math.sin(angle) * distance;

            if (this.isPointOutsideRoad(checkX, checkY)) {
                return distance;
            }

            distance += step;
        }

        return maxDistance;
    }

    // Check if a point is outside the road boundaries
    isPointOutsideRoad(x, y) {
        // Check if point is outside the road boundaries
        // This is a simplified version - you might want to implement a more accurate check
        const margin = 5; // Margin for collision detection

        // Check distance to left boundary
        for (let i = 0; i < this.leftBoundary.length - 1; i++) {
            const p1 = this.leftBoundary[i];
            const p2 = this.leftBoundary[i + 1];
            if (this.distanceToLine(x, y, p1.x, p1.y, p2.x, p2.y) < margin) {
                return true;
            }
        }

        // Check distance to right boundary
        for (let i = 0; i < this.rightBoundary.length - 1; i++) {
            const p1 = this.rightBoundary[i];
            const p2 = this.rightBoundary[i + 1];
            if (this.distanceToLine(x, y, p1.x, p1.y, p2.x, p2.y) < margin) {
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
        this.leftBoundary = [];
        this.rightBoundary = [];
        this.startPoint = null;
        this.endPoint = null;
    }
} 