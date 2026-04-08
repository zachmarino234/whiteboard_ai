'use client';

import { StateNode, createShapeId } from '@tldraw/editor';

export class LatexShapeTool extends StateNode {
  static override id = 'latex';

  override onEnter() {
    this.createLatexShape();
  }

  private createLatexShape() {
    const id = createShapeId();
    const { x, y } = this.editor.inputs.currentPagePoint;

    this.editor.createShape({
      id,
      type: 'latex',
      x: x - 100,
      y: y - 40,
      props: {
        w: 200,
        h: 80,
        latex: 'E = mc^2',
        color: '#ffffff',
        fontSize: 24,
      },
    });

    this.editor.select(id);
    this.editor.setEditingShape(id);
    this.editor.setCurrentTool('select');
  }
}
