import { Vector2D, OpticalElement, Lens, Mirror, OpticalObject } from './types';
import { vec } from './ray';

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 600;

export type DragTarget =
  | { type: 'object' }
  | { type: 'element'; id: string }
  | null;

/**
 * Interaction handler for mouse/touch events
 */
export class InteractionHandler {
  private canvas: HTMLCanvasElement;
  private dragTarget: DragTarget = null;
  private dragOffset: Vector2D = { x: 0, y: 0 };
  private isDragging: boolean = false;
  
  constructor(
    canvas: HTMLCanvasElement,
    private onObjectMove: (position: Vector2D) => void,
    private onElementMove: (id: string, position: Vector2D) => void
  ) {
    this.canvas = canvas;
    this.setupEventListeners();
  }
  
  /**
   * Setup mouse and touch event listeners
   */
  private setupEventListeners(): void {
    // Mouse events
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this));
    
    // Touch events for mobile
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
  }
  
  /**
   * Get mouse position relative to canvas
   */
  private getMousePos(event: MouseEvent | Touch): Vector2D {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }
  
  /**
   * Hit test for object
   */
  private hitTestObject(pos: Vector2D, object: OpticalObject): boolean {
    const objectTop = object.position.y - object.height;
    const objectBottom = object.position.y;
    const objectLeft = object.position.x - object.width / 2;
    const objectRight = object.position.x + object.width / 2;
    
    return (
      pos.x >= objectLeft &&
      pos.x <= objectRight &&
      pos.y >= objectTop &&
      pos.y <= objectBottom
    );
  }
  
  /**
   * Hit test for lens
   */
  private hitTestLens(pos: Vector2D, lens: Lens): boolean {
    const halfDiameter = lens.diameter / 2;
    const lensTop = lens.position.y - halfDiameter;
    const lensBottom = lens.position.y + halfDiameter;
    const lensLeft = lens.position.x - 30;
    const lensRight = lens.position.x + 30;
    
    return (
      pos.x >= lensLeft &&
      pos.x <= lensRight &&
      pos.y >= lensTop &&
      pos.y <= lensBottom
    );
  }
  
  /**
   * Hit test for mirror
   */
  private hitTestMirror(pos: Vector2D, mirror: Mirror): boolean {
    const halfDiameter = mirror.diameter / 2;
    const mirrorTop = mirror.position.y - halfDiameter;
    const mirrorBottom = mirror.position.y + halfDiameter;
    const mirrorLeft = mirror.position.x - 30;
    const mirrorRight = mirror.position.x + 30;
    
    return (
      pos.x >= mirrorLeft &&
      pos.x <= mirrorRight &&
      pos.y >= mirrorTop &&
      pos.y <= mirrorBottom
    );
  }
  
  /**
   * Find what element was clicked
   */
  private findClickTarget(
    pos: Vector2D,
    object: OpticalObject,
    elements: OpticalElement[]
  ): DragTarget {
    // Check object first
    if (this.hitTestObject(pos, object)) {
      return { type: 'object' };
    }
    
    // Check elements
    for (const element of elements) {
      if ('refractiveIndex' in element) {
        // It's a lens
        if (this.hitTestLens(pos, element)) {
          return { type: 'element', id: element.id };
        }
      } else {
        // It's a mirror
        if (this.hitTestMirror(pos, element)) {
          return { type: 'element', id: element.id };
        }
      }
    }
    
    return null;
  }
  
  /**
   * Handle mouse down
   */
  private handleMouseDown(event: MouseEvent): void {
    const pos = this.getMousePos(event);
    this.startDrag(pos);
  }
  
  /**
   * Handle mouse move
   */
  private handleMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return;
    
    const pos = this.getMousePos(event);
    this.updateDrag(pos);
  }
  
  /**
   * Handle mouse up
   */
  private handleMouseUp(): void {
    this.endDrag();
  }
  
  /**
   * Handle touch start
   */
  private handleTouchStart(event: TouchEvent): void {
    event.preventDefault();
    if (event.touches.length > 0) {
      const pos = this.getMousePos(event.touches[0]);
      this.startDrag(pos);
    }
  }
  
  /**
   * Handle touch move
   */
  private handleTouchMove(event: TouchEvent): void {
    event.preventDefault();
    if (!this.isDragging || event.touches.length === 0) return;
    
    const pos = this.getMousePos(event.touches[0]);
    this.updateDrag(pos);
  }
  
  /**
   * Handle touch end
   */
  private handleTouchEnd(event: TouchEvent): void {
    event.preventDefault();
    this.endDrag();
  }
  
  /**
   * Start dragging
   */
  public startDrag(pos: Vector2D, object?: OpticalObject, elements?: OpticalElement[]): void {
    if (!object || !elements) return;
    
    this.dragTarget = this.findClickTarget(pos, object, elements);
    
    if (this.dragTarget) {
      this.isDragging = true;
      
      if (this.dragTarget.type === 'object') {
        this.dragOffset = vec.subtract(object.position, pos);
      } else if (this.dragTarget.type === 'element') {
        const elementId = this.dragTarget.id;
        const element = elements.find((el) => el.id === elementId)!;
        this.dragOffset = vec.subtract(element.position, pos);
      }
    }
  }
  
  /**
   * Update drag position
   */
  public updateDrag(pos: Vector2D): void {
    if (!this.isDragging || !this.dragTarget) return;
    
    const newPos = vec.add(pos, this.dragOffset);
    
    // Constrain to canvas bounds
    const constrainedPos = {
      x: Math.max(50, Math.min(CANVAS_WIDTH - 50, newPos.x)),
      y: Math.max(50, Math.min(CANVAS_HEIGHT - 50, newPos.y)),
    };
    
    if (this.dragTarget.type === 'object') {
      this.onObjectMove(constrainedPos);
    } else if (this.dragTarget.type === 'element') {
      this.onElementMove(this.dragTarget.id, constrainedPos);
    }
  }
  
  /**
   * End dragging
   */
  public endDrag(): void {
    this.isDragging = false;
    this.dragTarget = null;
  }
  
  /**
   * Get current drag state
   */
  public getDragState(): { isDragging: boolean; target: DragTarget } {
    return {
      isDragging: this.isDragging,
      target: this.dragTarget,
    };
  }
  
  /**
   * Cleanup event listeners
   */
  public cleanup(): void {
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    this.canvas.removeEventListener('mouseleave', this.handleMouseUp);
    this.canvas.removeEventListener('touchstart', this.handleTouchStart);
    this.canvas.removeEventListener('touchmove', this.handleTouchMove);
    this.canvas.removeEventListener('touchend', this.handleTouchEnd);
  }
}
