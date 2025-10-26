export interface ARAnnotation {
  id: string;
  type: 'arrow' | 'circle' | 'text' | 'measurement' | 'highlight';
  position: { x: number; y: number };
  color: string;
  text?: string;
  size?: number;
  rotation?: number;
  createdBy: string;
  timestamp: Date;
}

export class ARAnnotationService {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private annotations: ARAnnotation[] = [];
  private activeAnnotation: ARAnnotation | null = null;
  private isDrawing = false;
  private videoElement: HTMLVideoElement | null = null;

  initialize(videoElement: HTMLVideoElement, canvasElement: HTMLCanvasElement) {
    this.videoElement = videoElement;
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');

    if (!this.ctx) {
      throw new Error('Failed to get canvas context');
    }

    this.canvas.width = videoElement.videoWidth || 1280;
    this.canvas.height = videoElement.videoHeight || 720;

    this.setupEventListeners();
    this.startRendering();

    console.log('✅ AR Annotations initialized');
  }

  private setupEventListeners() {
    if (!this.canvas) return;

    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
  }

  private handleMouseDown(e: MouseEvent) {
    if (!this.canvas) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    this.isDrawing = true;
    this.startAnnotation(x, y);
  }

  private handleMouseMove(e: MouseEvent) {
    if (!this.isDrawing || !this.canvas || !this.activeAnnotation) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    this.updateAnnotation(x, y);
  }

  private handleMouseUp() {
    if (this.isDrawing && this.activeAnnotation) {
      this.finishAnnotation();
    }
    this.isDrawing = false;
  }

  private handleTouchStart(e: TouchEvent) {
    e.preventDefault();
    if (!this.canvas) return;

    const touch = e.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    this.isDrawing = true;
    this.startAnnotation(x, y);
  }

  private handleTouchMove(e: TouchEvent) {
    e.preventDefault();
    if (!this.isDrawing || !this.canvas || !this.activeAnnotation) return;

    const touch = e.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    this.updateAnnotation(x, y);
  }

  private handleTouchEnd(e: TouchEvent) {
    e.preventDefault();
    if (this.isDrawing && this.activeAnnotation) {
      this.finishAnnotation();
    }
    this.isDrawing = false;
  }

  private startAnnotation(x: number, y: number) {
    this.activeAnnotation = {
      id: this.generateId(),
      type: 'arrow',
      position: { x, y },
      color: '#FF6B35',
      size: 30,
      rotation: 0,
      createdBy: 'current_user',
      timestamp: new Date()
    };
  }

  private updateAnnotation(x: number, y: number) {
    if (!this.activeAnnotation) return;

    const dx = x - this.activeAnnotation.position.x;
    const dy = y - this.activeAnnotation.position.y;
    this.activeAnnotation.rotation = Math.atan2(dy, dx);
    this.activeAnnotation.size = Math.min(Math.sqrt(dx * dx + dy * dy), 100);
  }

  private finishAnnotation() {
    if (this.activeAnnotation) {
      this.annotations.push(this.activeAnnotation);
      this.broadcastAnnotation(this.activeAnnotation);
      this.activeAnnotation = null;
    }
  }

  addTextAnnotation(x: number, y: number, text: string, userId: string) {
    const annotation: ARAnnotation = {
      id: this.generateId(),
      type: 'text',
      position: { x, y },
      color: '#4ECDC4',
      text,
      createdBy: userId,
      timestamp: new Date()
    };

    this.annotations.push(annotation);
    this.broadcastAnnotation(annotation);
  }

  addCircleAnnotation(x: number, y: number, size: number, userId: string) {
    const annotation: ARAnnotation = {
      id: this.generateId(),
      type: 'circle',
      position: { x, y },
      color: '#FFE66D',
      size,
      createdBy: userId,
      timestamp: new Date()
    };

    this.annotations.push(annotation);
    this.broadcastAnnotation(annotation);
  }

  addMeasurement(startX: number, startY: number, endX: number, endY: number, userId: string) {
    const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
    const pixelToMeterRatio = 0.01;
    const meters = (distance * pixelToMeterRatio).toFixed(2);

    const annotation: ARAnnotation = {
      id: this.generateId(),
      type: 'measurement',
      position: { x: startX, y: startY },
      color: '#95E1D3',
      text: `${meters}m`,
      size: distance,
      rotation: Math.atan2(endY - startY, endX - startX),
      createdBy: userId,
      timestamp: new Date()
    };

    this.annotations.push(annotation);
    this.broadcastAnnotation(annotation);
  }

  private startRendering() {
    const render = () => {
      if (!this.ctx || !this.canvas) return;

      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      this.annotations.forEach(annotation => {
        this.renderAnnotation(annotation);
      });

      if (this.activeAnnotation) {
        this.renderAnnotation(this.activeAnnotation);
      }

      requestAnimationFrame(render);
    };

    render();
  }

  private renderAnnotation(annotation: ARAnnotation) {
    if (!this.ctx) return;

    this.ctx.save();
    this.ctx.strokeStyle = annotation.color;
    this.ctx.fillStyle = annotation.color;
    this.ctx.lineWidth = 3;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    const { x, y } = annotation.position;

    switch (annotation.type) {
      case 'arrow':
        this.drawArrow(x, y, annotation.size || 30, annotation.rotation || 0);
        break;
      case 'circle':
        this.drawCircle(x, y, annotation.size || 40);
        break;
      case 'text':
        this.drawText(x, y, annotation.text || '');
        break;
      case 'measurement':
        this.drawMeasurement(x, y, annotation.size || 100, annotation.rotation || 0, annotation.text || '');
        break;
      case 'highlight':
        this.drawHighlight(x, y, annotation.size || 60);
        break;
    }

    this.ctx.restore();
  }

  private drawArrow(x: number, y: number, length: number, rotation: number) {
    if (!this.ctx) return;

    this.ctx.translate(x, y);
    this.ctx.rotate(rotation);

    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    this.ctx.lineTo(length, 0);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(length, 0);
    this.ctx.lineTo(length - 10, -8);
    this.ctx.lineTo(length - 10, 8);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  private drawCircle(x: number, y: number, radius: number) {
    if (!this.ctx) return;

    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
    this.ctx.stroke();
  }

  private drawText(x: number, y: number, text: string) {
    if (!this.ctx) return;

    this.ctx.font = 'bold 20px Arial';
    this.ctx.fillText(text, x, y);

    const metrics = this.ctx.measureText(text);
    this.ctx.strokeRect(x - 5, y - 20, metrics.width + 10, 30);
  }

  private drawMeasurement(x: number, y: number, length: number, rotation: number, text: string) {
    if (!this.ctx) return;

    this.ctx.translate(x, y);
    this.ctx.rotate(rotation);

    this.ctx.setLineDash([5, 5]);
    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    this.ctx.lineTo(length, 0);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    this.ctx.font = 'bold 16px Arial';
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fillRect(length / 2 - 25, -15, 50, 20);
    this.ctx.fillStyle = this.ctx.strokeStyle;
    this.ctx.fillText(text, length / 2 - 20, 0);

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  private drawHighlight(x: number, y: number, size: number) {
    if (!this.ctx) return;

    this.ctx.globalAlpha = 0.3;
    this.ctx.beginPath();
    this.ctx.arc(x, y, size, 0, 2 * Math.PI);
    this.ctx.fill();
    this.ctx.globalAlpha = 1.0;
  }

  clearAnnotations() {
    this.annotations = [];
    console.log('🗑️ Cleared all annotations');
  }

  removeAnnotation(id: string) {
    this.annotations = this.annotations.filter(a => a.id !== id);
  }

  getAnnotations(): ARAnnotation[] {
    return [...this.annotations];
  }

  private broadcastAnnotation(annotation: ARAnnotation) {
    console.log('📡 Broadcasting annotation:', annotation);
  }

  private generateId(): string {
    return `annotation_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  exportAnnotations(): string {
    return JSON.stringify(this.annotations, null, 2);
  }

  importAnnotations(json: string) {
    try {
      this.annotations = JSON.parse(json);
      console.log('✅ Imported annotations');
    } catch (error) {
      console.error('Failed to import annotations:', error);
    }
  }

  destroy() {
    if (this.canvas) {
      this.canvas.removeEventListener('mousedown', this.handleMouseDown);
      this.canvas.removeEventListener('mousemove', this.handleMouseMove);
      this.canvas.removeEventListener('mouseup', this.handleMouseUp);
      this.canvas.removeEventListener('touchstart', this.handleTouchStart);
      this.canvas.removeEventListener('touchmove', this.handleTouchMove);
      this.canvas.removeEventListener('touchend', this.handleTouchEnd);
    }

    this.annotations = [];
    this.activeAnnotation = null;
    console.log('✅ AR Annotations destroyed');
  }
}

export const arAnnotations = new ARAnnotationService();
