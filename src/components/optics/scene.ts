import {
  OpticalObject,
  OpticalElement,
  Lens,
  Mirror,
  Ray,
  ImageData,
  Vector2D,
} from './types';

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 600;
const PRINCIPAL_AXIS_Y = CANVAS_HEIGHT / 2;

/**
 * Canvas rendering engine for optical elements and rays
 */
export class OpticsRenderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  
  constructor(canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    this.width = canvas.width;
    this.height = canvas.height;
  }
  
  /**
   * Clear the canvas
   */
  clear(): void {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }
  
  /**
   * Draw the principal axis
   */
  drawPrincipalAxis(): void {
    this.ctx.strokeStyle = '#ffffff40';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([5, 5]);
    this.ctx.beginPath();
    this.ctx.moveTo(0, PRINCIPAL_AXIS_Y);
    this.ctx.lineTo(this.width, PRINCIPAL_AXIS_Y);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }
  
  /**
   * Draw grid for reference
   */
  drawGrid(): void {
    this.ctx.strokeStyle = '#ffffff10';
    this.ctx.lineWidth = 0.5;
    
    // Vertical lines
    for (let x = 0; x < this.width; x += 50) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y < this.height; y += 50) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
      this.ctx.stroke();
    }
  }
  
  /**
   * Draw an optical object (candle, arrow, pencil)
   */
  drawObject(object: OpticalObject, highlight: boolean = false): void {
    const { position, height, width, type } = object;
    
    this.ctx.save();
    
    if (highlight) {
      this.ctx.shadowColor = '#00ff88';
      this.ctx.shadowBlur = 20;
    }
    
    if (type === 'arrow') {
      // Draw arrow
      this.ctx.strokeStyle = '#00ff88';
      this.ctx.fillStyle = '#00ff88';
      this.ctx.lineWidth = 3;
      
      // Shaft
      this.ctx.beginPath();
      this.ctx.moveTo(position.x, position.y);
      this.ctx.lineTo(position.x, position.y - height);
      this.ctx.stroke();
      
      // Arrowhead
      this.ctx.beginPath();
      this.ctx.moveTo(position.x, position.y - height);
      this.ctx.lineTo(position.x - 10, position.y - height + 15);
      this.ctx.lineTo(position.x + 10, position.y - height + 15);
      this.ctx.closePath();
      this.ctx.fill();
      
    } else if (type === 'candle') {
      // Draw candle
      this.ctx.fillStyle = '#ffaa00';
      this.ctx.fillRect(
        position.x - width / 2,
        position.y - height * 0.7,
        width,
        height * 0.7
      );
      
      // Flame
      this.ctx.fillStyle = '#ff6b6b';
      this.ctx.beginPath();
      this.ctx.ellipse(
        position.x,
        position.y - height,
        width / 2,
        height * 0.3,
        0,
        0,
        Math.PI * 2
      );
      this.ctx.fill();
      
    } else if (type === 'pencil') {
      // Draw pencil
      this.ctx.fillStyle = '#ffd93d';
      this.ctx.fillRect(
        position.x - width / 2,
        position.y - height,
        width,
        height * 0.9
      );
      
      // Tip
      this.ctx.fillStyle = '#333';
      this.ctx.beginPath();
      this.ctx.moveTo(position.x, position.y - height);
      this.ctx.lineTo(position.x - width / 2, position.y - height * 0.9);
      this.ctx.lineTo(position.x + width / 2, position.y - height * 0.9);
      this.ctx.closePath();
      this.ctx.fill();
    }
    
    this.ctx.restore();
  }
  
  /**
   * Draw a lens
   */
  drawLens(lens: Lens, showLabels: boolean = true, showFocalPoints: boolean = true): void {
    const { position, diameter, type, focalLength } = lens;
    
    this.ctx.save();
    
    // Draw lens body
    this.ctx.strokeStyle = type === 'convex' ? '#4ecdc4' : '#ff6b6b';
    this.ctx.lineWidth = 4;
    
    const halfDiameter = diameter / 2;
    
    if (type === 'convex') {
      // Convex lens (biconvex shape)
      this.ctx.beginPath();
      
      // Left curve
      this.ctx.arc(
        position.x - 20,
        position.y,
        halfDiameter,
        -Math.PI / 2,
        Math.PI / 2
      );
      
      // Right curve
      this.ctx.arc(
        position.x + 20,
        position.y,
        halfDiameter,
        Math.PI / 2,
        -Math.PI / 2
      );
      
      this.ctx.closePath();
      this.ctx.stroke();
      
      // Fill with slight transparency
      this.ctx.fillStyle = '#4ecdc420';
      this.ctx.fill();
      
    } else {
      // Concave lens (biconcave shape)
      this.ctx.beginPath();
      
      // Left curve (inverted)
      this.ctx.arc(
        position.x + 20,
        position.y,
        halfDiameter,
        Math.PI / 2,
        -Math.PI / 2,
        true
      );
      
      // Right curve (inverted)
      this.ctx.arc(
        position.x - 20,
        position.y,
        halfDiameter,
        -Math.PI / 2,
        Math.PI / 2,
        true
      );
      
      this.ctx.closePath();
      this.ctx.stroke();
      
      this.ctx.fillStyle = '#ff6b6b20';
      this.ctx.fill();
    }
    
    // Draw center line
    this.ctx.strokeStyle = '#ffffff80';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(position.x, position.y - halfDiameter);
    this.ctx.lineTo(position.x, position.y + halfDiameter);
    this.ctx.stroke();
    
    // Draw focal points
    if (showFocalPoints) {
      const focalRadius = 5;
      this.ctx.fillStyle = '#ffd93d';
      
      // Near focal point (F)
      this.ctx.beginPath();
      this.ctx.arc(
        position.x - Math.abs(focalLength),
        PRINCIPAL_AXIS_Y,
        focalRadius,
        0,
        Math.PI * 2
      );
      this.ctx.fill();
      
      // Far focal point (F')
      this.ctx.beginPath();
      this.ctx.arc(
        position.x + Math.abs(focalLength),
        PRINCIPAL_AXIS_Y,
        focalRadius,
        0,
        Math.PI * 2
      );
      this.ctx.fill();
      
      if (showLabels) {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '14px Arial';
        this.ctx.fillText('F', position.x - Math.abs(focalLength) - 5, PRINCIPAL_AXIS_Y - 10);
        this.ctx.fillText("F'", position.x + Math.abs(focalLength) - 5, PRINCIPAL_AXIS_Y - 10);
        
        // 2F points
        this.ctx.fillStyle = '#ffffff80';
        this.ctx.fillText('2F', position.x - Math.abs(focalLength) * 2 - 5, PRINCIPAL_AXIS_Y - 10);
        this.ctx.fillText("2F'", position.x + Math.abs(focalLength) * 2 - 5, PRINCIPAL_AXIS_Y - 10);
      }
    }
    
    this.ctx.restore();
  }
  
  /**
   * Draw a mirror
   */
  drawMirror(mirror: Mirror, showLabels: boolean = true, showFocalPoints: boolean = true): void {
    const { position, diameter, type, focalLength } = mirror;
    
    this.ctx.save();
    
    const halfDiameter = diameter / 2;
    
    if (type === 'plane') {
      // Plane mirror (straight line)
      this.ctx.strokeStyle = '#95e1d3';
      this.ctx.lineWidth = 6;
      this.ctx.beginPath();
      this.ctx.moveTo(position.x, position.y - halfDiameter);
      this.ctx.lineTo(position.x, position.y + halfDiameter);
      this.ctx.stroke();
      
      // Reflective surface indicator (hatching on left side)
      this.ctx.strokeStyle = '#95e1d340';
      this.ctx.lineWidth = 2;
      for (let i = 0; i < 10; i++) {
        const y = position.y - halfDiameter + (diameter / 10) * i;
        this.ctx.beginPath();
        this.ctx.moveTo(position.x, y);
        this.ctx.lineTo(position.x - 15, y + 10);
        this.ctx.stroke();
      }
      
    } else {
      // Curved mirror
      this.ctx.strokeStyle = type === 'concave' ? '#4ecdc4' : '#ff6b6b';
      this.ctx.lineWidth = 6;
      
      const radius = Math.abs(mirror.radiusOfCurvature);
      const centerX = position.x + (type === 'concave' ? radius : -radius);
      
      // Calculate start and end angles for the arc
      const angle = Math.asin(halfDiameter / radius);
      
      this.ctx.beginPath();
      if (type === 'concave') {
        this.ctx.arc(centerX, position.y, radius, Math.PI - angle, Math.PI + angle);
      } else {
        this.ctx.arc(centerX, position.y, radius, -angle, angle);
      }
      this.ctx.stroke();
      
      // Reflective surface indicator
      this.ctx.strokeStyle = this.ctx.strokeStyle + '40';
      this.ctx.lineWidth = 2;
      
      for (let i = 0; i < 8; i++) {
        const fraction = (i / 8) * 2 - 1;
        const y = position.y + halfDiameter * fraction;
        const x = position.x + (type === 'concave' ? -10 : 10);
        this.ctx.beginPath();
        this.ctx.moveTo(position.x, y);
        this.ctx.lineTo(x, y + (type === 'concave' ? 10 : -10));
        this.ctx.stroke();
      }
    }
    
    // Draw focal point
    if (showFocalPoints && type !== 'plane') {
      const focalRadius = 5;
      this.ctx.fillStyle = '#ffd93d';
      
      this.ctx.beginPath();
      this.ctx.arc(
        position.x - Math.abs(focalLength),
        PRINCIPAL_AXIS_Y,
        focalRadius,
        0,
        Math.PI * 2
      );
      this.ctx.fill();
      
      if (showLabels) {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '14px Arial';
        this.ctx.fillText('F', position.x - Math.abs(focalLength) - 5, PRINCIPAL_AXIS_Y - 10);
        this.ctx.fillText('C', position.x - Math.abs(mirror.radiusOfCurvature) - 5, PRINCIPAL_AXIS_Y - 10);
      }
    }
    
    this.ctx.restore();
  }
  
  /**
   * Draw a ray
   */
  drawRay(ray: Ray, maxLength: number = 1000): void {
    this.ctx.save();
    
    this.ctx.strokeStyle = ray.color;
    this.ctx.lineWidth = 2;
    this.ctx.globalAlpha = ray.intensity;
    
    const endPoint = {
      x: ray.origin.x + ray.direction.x * maxLength,
      y: ray.origin.y + ray.direction.y * maxLength,
    };
    
    this.ctx.beginPath();
    this.ctx.moveTo(ray.origin.x, ray.origin.y);
    this.ctx.lineTo(endPoint.x, endPoint.y);
    this.ctx.stroke();
    
    // Draw arrowhead
    const arrowSize = 8;
    const angle = Math.atan2(ray.direction.y, ray.direction.x);
    
    this.ctx.fillStyle = ray.color;
    this.ctx.beginPath();
    this.ctx.moveTo(
      ray.origin.x + ray.direction.x * 50,
      ray.origin.y + ray.direction.y * 50
    );
    this.ctx.lineTo(
      ray.origin.x + ray.direction.x * 50 - arrowSize * Math.cos(angle - Math.PI / 6),
      ray.origin.y + ray.direction.y * 50 - arrowSize * Math.sin(angle - Math.PI / 6)
    );
    this.ctx.lineTo(
      ray.origin.x + ray.direction.x * 50 - arrowSize * Math.cos(angle + Math.PI / 6),
      ray.origin.y + ray.direction.y * 50 - arrowSize * Math.sin(angle + Math.PI / 6)
    );
    this.ctx.closePath();
    this.ctx.fill();
    
    this.ctx.restore();
  }
  
  /**
   * Draw the formed image
   */
  drawImage(image: ImageData, showVirtual: boolean = true): void {
    if (!image.isReal && !showVirtual) return;
    
    this.ctx.save();
    
    // Virtual images are drawn with dashed lines
    if (!image.isReal) {
      this.ctx.setLineDash([5, 5]);
      this.ctx.globalAlpha = 0.6;
    }
    
    this.ctx.strokeStyle = image.isReal ? '#00ff88' : '#ff00ff';
    this.ctx.fillStyle = image.isReal ? '#00ff8840' : '#ff00ff40';
    this.ctx.lineWidth = 3;
    
    const imageTop = image.isInverted
      ? image.position.y + image.height
      : image.position.y - image.height;
    
    // Draw image arrow
    this.ctx.beginPath();
    this.ctx.moveTo(image.position.x, image.position.y);
    this.ctx.lineTo(image.position.x, imageTop);
    this.ctx.stroke();
    
    // Arrowhead
    this.ctx.beginPath();
    this.ctx.moveTo(image.position.x, imageTop);
    this.ctx.lineTo(image.position.x - 10, imageTop + (image.isInverted ? -15 : 15));
    this.ctx.lineTo(image.position.x + 10, imageTop + (image.isInverted ? -15 : 15));
    this.ctx.closePath();
    this.ctx.fill();
    
    // Label
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '12px Arial';
    this.ctx.fillText(
      image.isReal ? 'Real Image' : 'Virtual Image',
      image.position.x + 10,
      imageTop
    );
    this.ctx.fillText(
      `M = ${image.magnification.toFixed(2)}`,
      image.position.x + 10,
      imageTop + 15
    );
    
    this.ctx.restore();
  }
  
  /**
   * Render complete scene
   */
  render(
    object: OpticalObject,
    elements: OpticalElement[],
    rays: Ray[],
    image: ImageData | null,
    options: {
      showRays: boolean;
      showFocalPoints: boolean;
      showVirtualImage: boolean;
      showLabels: boolean;
      showMeasurements?: boolean;
      highlightObject?: boolean;
    }
  ): void {
    this.clear();
    this.drawGrid();
    this.drawPrincipalAxis();
    
    // Draw optical elements
    elements.forEach((element) => {
      if ('refractiveIndex' in element) {
        this.drawLens(element, options.showLabels, options.showFocalPoints);
      } else {
        this.drawMirror(element, options.showLabels, options.showFocalPoints);
      }
    });
    
    // Draw rays
    if (options.showRays) {
      rays.forEach((ray) => this.drawRay(ray));
    }
    
    // Draw object
    this.drawObject(object, options.highlightObject);
    
    // Draw image
    if (image) {
      this.drawImage(image, options.showVirtualImage);
    }
    
    // Draw measurements
    if (options.showMeasurements && elements.length > 0) {
      this.drawMeasurements(object, elements[0], image);
    }
  }
  
  /**
   * Draw measurement annotations (distances, angles, labels)
   */
  private drawMeasurements(object: OpticalObject, element: OpticalElement, image: ImageData | null): void {
    const PIXELS_TO_CM = 10; // 10 pixels = 1 cm
    
    this.ctx.save();
    this.ctx.font = '12px monospace';
    this.ctx.strokeStyle = '#fbbf24';
    this.ctx.fillStyle = '#fbbf24';
    this.ctx.lineWidth = 1.5;
    
    // Object distance measurement
    const objectDist = Math.abs(element.position.x - object.position.x);
    this.drawDistanceLine(
      object.position.x,
      PRINCIPAL_AXIS_Y + 30,
      element.position.x,
      PRINCIPAL_AXIS_Y + 30,
      `u = ${(objectDist / PIXELS_TO_CM).toFixed(1)} cm`
    );
    
    // Image distance measurement
    if (image) {
      const imageDist = Math.abs(image.position.x - element.position.x);
      this.drawDistanceLine(
        element.position.x,
        PRINCIPAL_AXIS_Y + 50,
        image.position.x,
        PRINCIPAL_AXIS_Y + 50,
        `v = ${(imageDist / PIXELS_TO_CM).toFixed(1)} cm`
      );
    }
    
    // Focal length markers
    const focalDist = Math.abs(element.focalLength);
    
    // Left focal point
    this.ctx.beginPath();
    this.ctx.arc(element.position.x - focalDist, PRINCIPAL_AXIS_Y, 6, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillText('F', element.position.x - focalDist + 10, PRINCIPAL_AXIS_Y - 10);
    
    // Right focal point
    this.ctx.beginPath();
    this.ctx.arc(element.position.x + focalDist, PRINCIPAL_AXIS_Y, 6, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillText("F'", element.position.x + focalDist + 10, PRINCIPAL_AXIS_Y - 10);
    
    // Focal length measurement
    this.drawDistanceLine(
      element.position.x,
      PRINCIPAL_AXIS_Y - 30,
      element.position.x - focalDist,
      PRINCIPAL_AXIS_Y - 30,
      `f = ${(focalDist / PIXELS_TO_CM).toFixed(1)} cm`
    );
    
    // Angle of incidence (calculated from object position relative to principal axis)
    if (object.height !== 0) {
      const angleRad = Math.atan2(object.height, objectDist);
      const angleDeg = Math.abs(angleRad * (180 / Math.PI));
      
      // Draw angle arc
      this.ctx.beginPath();
      this.ctx.arc(element.position.x, PRINCIPAL_AXIS_Y, 40, Math.PI, Math.PI - angleRad, angleRad > 0);
      this.ctx.stroke();
      
      this.ctx.fillText(
        `θ = ${angleDeg.toFixed(1)}°`,
        element.position.x - 70,
        PRINCIPAL_AXIS_Y - 45
      );
    }
    
    this.ctx.restore();
  }
  
  /**
   * Draw a distance measurement line with label
   */
  private drawDistanceLine(x1: number, y1: number, x2: number, y2: number, label: string): void {
    // Main line
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.stroke();
    
    // End caps
    const capHeight = 8;
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1 - capHeight);
    this.ctx.lineTo(x1, y1 + capHeight);
    this.ctx.moveTo(x2, y2 - capHeight);
    this.ctx.lineTo(x2, y2 + capHeight);
    this.ctx.stroke();
    
    // Label (centered)
    const midX = (x1 + x2) / 2;
    const midY = y1 - 5;
    const textMetrics = this.ctx.measureText(label);
    
    // Background for label
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(midX - textMetrics.width / 2 - 3, midY - 12, textMetrics.width + 6, 16);
    
    // Label text
    this.ctx.fillStyle = '#fbbf24';
    this.ctx.fillText(label, midX - textMetrics.width / 2, midY);
  }
}
