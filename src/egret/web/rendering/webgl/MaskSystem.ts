//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-present, Egret Technology.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////

namespace egret.web {

    /** !!!!!!!! inspired by pixi !!!!!!!!!!!!!
     */
    class MaskState {

        public displayObject: DisplayObject = null;
        public renderTarget: egret.web.WebGLRenderBuffer = null;
        public offsetX: number = 0;
        public offsetY: number = 0;
        public scissor: boolean = false;
        public x: number = 0;
        public y: number = 0;
        public width: number = 0;
        public height: number = 0;
        public enable: boolean = false;
        public currentCompositeOp: string = '';
        public isSpriteMask: boolean = false;
        public displayBoundsX: number = 0;
        public displayBoundsY: number = 0;
        public displayBoundsWidth: number = 0;
        public displayBoundsHeight: number = 0;
        public displayBuffer: egret.web.WebGLRenderBuffer = null;
        public maskBuffer: egret.web.WebGLRenderBuffer = null;

        constructor() {
        }

        public clear(): void {
            this.displayObject = null;
            this.renderTarget = null;
            this.offsetX = 0;
            this.offsetY = 0;
            this.scissor = false;
            this.x = 0;
            this.y = 0;
            this.width = 0;
            this.height = 0;
            this.enable = false;
            this.currentCompositeOp = '';
            this.isSpriteMask = false;
            this.displayBoundsX = 0;
            this.displayBoundsY = 0;
            this.displayBoundsWidth = 0;
            this.displayBoundsHeight = 0;
            this.displayBuffer = null;
            this.maskBuffer = null;
        }
    }

    /** !!!!!!!! inspired by pixi !!!!!!!!!!!!!
    */
    export class MaskSystem {

        private readonly _webglRenderContext: WebGLRenderContext;
        private readonly statePool: MaskState[] = [];
        private readonly defaultMaskStack: MaskState[] = [];
        public _webglRender: WebGLRenderer = null;

        constructor(webglRenderContext: WebGLRenderContext) {
            this._webglRenderContext = webglRenderContext;
        }

        public push(target: DisplayObject, renderTargetRoot: WebGLRenderBuffer,
            offsetX: number, offsetY: number,
            drawAdvancedData: IDrawAdvancedData): void {

            //
            const defaultMaskStack = this.defaultMaskStack;
            const state = this.statePool.pop() || new MaskState();
            defaultMaskStack.push(state);
            //
            if (target.$mask) {
                state.enable = true;
                state.isSpriteMask = true;
                //console.warn('MaskSystem: push: displayObject.$mask');
                this.pushSpriteMask(state, target, renderTargetRoot, offsetX, offsetY, drawAdvancedData);
            }
            else {
                state.enable = true;
                state.isSpriteMask = false;
                this.pushScissorOrStencilMask(state, target, renderTargetRoot, offsetX, offsetY, drawAdvancedData);
            }
        }

        private pushSpriteMask(state: MaskState,
            displayObject: DisplayObject,
            buffer: WebGLRenderBuffer,
            offsetX: number, offsetY: number,
            drawAdvancedData: IDrawAdvancedData): void {

            let displayBounds = displayObject.$getOriginalBounds();
            const displayBoundsX = displayBounds.x;
            const displayBoundsY = displayBounds.y;
            const displayBoundsWidth = displayBounds.width;
            const displayBoundsHeight = displayBounds.height;


            state.displayObject = displayObject;
            state.renderTarget = buffer;
            state.offsetX = offsetX;
            state.offsetY = offsetY;

            //const displayBounds = displayObject.$getOriginalBounds();
            // const displayBoundsX = displayBounds.x;
            // const displayBoundsY = displayBounds.y;
            // const displayBoundsWidth = displayBounds.width;
            // const displayBoundsHeight = displayBounds.height;

            state.displayBoundsX = displayBounds.x;
            state.displayBoundsY = displayBounds.y;
            state.displayBoundsWidth = displayBounds.width;
            state.displayBoundsHeight = displayBounds.height;
            //let drawCalls = 0;


            // if (displayBoundsWidth <= 0 || displayBoundsHeight <= 0) {
            //     return drawCalls;
            // }
            //绘制显示对象自身，若有scrollRect，应用clip
            let displayBuffer = WebGLRenderBuffer.create(displayBoundsWidth, displayBoundsHeight);//;//this.createRenderBuffer(displayBoundsWidth, displayBoundsHeight);
            displayBuffer.context.pushBuffer(displayBuffer);
            state.displayBuffer = displayBuffer;
            //
            if (egret.transformRefactor) {
                displayObject.transformAsRenderRoot(-displayBoundsX, -displayBoundsY, displayBuffer.globalMatrix);
                displayObject.transform(-displayBoundsX, -displayBoundsY);
            }
            //drawCalls += this._webglRender.drawDisplayObject(displayObject, displayBuffer, -displayBoundsX, -displayBoundsY);
            //????
            drawAdvancedData.renderTarget = state.displayBuffer;
            drawAdvancedData.offsetX = -state.displayBoundsX;
            drawAdvancedData.offsetY = -state.displayBoundsY;
        }

        private pushScissorOrStencilMask(state: MaskState,
            displayObject: DisplayObject,
            buffer: WebGLRenderBuffer,
            offsetX: number, offsetY: number,
            drawAdvancedData: IDrawAdvancedData): void {

            if (DEBUG) {
                if (state.isSpriteMask) {
                    console.error('pushScissorOrStencilMask: state.isSpriteMask = ' + state.isSpriteMask);
                }
            }
            let scrollRect = displayObject.$scrollRect ? displayObject.$scrollRect : displayObject.$maskRect;
            if (DEBUG) {
                if (scrollRect.isEmpty()) {
                    console.error('MaskSystem: push: scrollRect.isEmpty()');
                }
            }
            if (displayObject.$scrollRect) {
                offsetX -= scrollRect.x;
                offsetY -= scrollRect.y;
            }
            //
            state.displayObject = displayObject;
            state.renderTarget = buffer;
            state.offsetX = offsetX;
            state.offsetY = offsetY;
            state.scissor = false;
            //save blendFunc;
            state.currentCompositeOp = blendModes[displayObject.$blendMode] || defaultCompositeOp;
            //????
            drawAdvancedData.renderTarget = buffer;
            drawAdvancedData.offsetX = offsetX;
            drawAdvancedData.offsetY = offsetY;
            //
            let m = buffer.globalMatrix;
            let context = buffer.context;
            //let scissor = false;
            if (buffer.$hasScissor || m.b !== 0 || m.c !== 0) {// 有旋转的情况下不能使用scissor
                buffer.context.pushMask(scrollRect.x + offsetX, scrollRect.y + offsetY, scrollRect.width, scrollRect.height);
                //save state
                state.x = scrollRect.x + offsetX;
                state.y = scrollRect.y + offsetY;
                state.width = scrollRect.width;
                state.height = scrollRect.height;
            } else {
                let a = m.a;
                let d = m.d;
                let tx = m.tx;
                let ty = m.ty;
                let x = scrollRect.x + offsetX;
                let y = scrollRect.y + offsetY;
                let xMax = x + scrollRect.width;
                let yMax = y + scrollRect.height;
                let minX: number, minY: number, maxX: number, maxY: number;
                //优化，通常情况下不缩放的对象占多数，直接加上偏移量即可。
                if (a === 1.0 && d === 1.0) {
                    minX = x + tx;
                    minY = y + ty;
                    maxX = xMax + tx;
                    maxY = yMax + ty;
                }
                else {
                    /*
                    x0---x1
                    |     |
                    x3---x2
                    */
                    let x0 = a * x + tx;
                    let y0 = d * y + ty;
                    let x1 = a * xMax + tx;
                    let y1 = d * y + ty;
                    let x2 = a * xMax + tx;
                    let y2 = d * yMax + ty;
                    let x3 = a * x + tx;
                    let y3 = d * yMax + ty;

                    let tmp = 0;

                    if (x0 > x1) {
                        tmp = x0;
                        x0 = x1;
                        x1 = tmp;
                    }
                    if (x2 > x3) {
                        tmp = x2;
                        x2 = x3;
                        x3 = tmp;
                    }

                    minX = (x0 < x2 ? x0 : x2);
                    maxX = (x1 > x3 ? x1 : x3);

                    if (y0 > y1) {
                        tmp = y0;
                        y0 = y1;
                        y1 = tmp;
                    }
                    if (y2 > y3) {
                        tmp = y2;
                        y2 = y3;
                        y3 = tmp;
                    }

                    minY = (y0 < y2 ? y0 : y2);
                    maxY = (y1 > y3 ? y1 : y3);
                }
                context.enableScissor(minX, -maxY + buffer.height, maxX - minX, maxY - minY);
                //save state
                state.x = minX;
                state.y = -maxY + buffer.height;
                state.width = maxX - minX;
                state.height = maxY - minY;
                //scissor = true;
                state.scissor = true;
            }
            this._webglRenderContext.setGlobalCompositeOperation(state.currentCompositeOp);
            //need transform
            if (egret.transformRefactor) {
                state.displayObject.transformAsRenderRoot(state.offsetX, state.offsetY, state.renderTarget.globalMatrix);
                state.displayObject.transform(state.offsetX, state.offsetY);
            }
        }

        private popScissorOrStencilMask(state: MaskState): void {
            if (DEBUG) {
                if (state.isSpriteMask) {
                    console.error('popScissorOrStencilMask: state.isSpriteMask = ' + state.isSpriteMask);
                }
            }
            this._webglRenderContext.setGlobalCompositeOperation(defaultCompositeOp);
            if (state.scissor) {
                //context.disableScissor();
                this._webglRenderContext.disableScissor();
            } else {
                //context.popMask();
                this._webglRenderContext.popMask();
            }
        }

        private popSpriteMask(state: MaskState): void {
            //绘制遮罩
            const mask = state.displayObject.$mask;
            const displayObject = state.displayObject;
            const displayBoundsX = state.displayBoundsX;
            const displayBoundsY = state.displayBoundsY;
            const displayBoundsWidth = state.displayBoundsWidth;
            const displayBoundsHeight = state.displayBoundsHeight;
            const displayBuffer = state.displayBuffer;
            const offsetX = state.offsetX;
            const offsetY = state.offsetY;
            let drawCalls = 0;

            if (mask) {
                let maskBuffer = WebGLRenderBuffer.create(displayBoundsWidth, displayBoundsHeight);//this.createRenderBuffer(displayBoundsWidth, displayBoundsHeight);
                maskBuffer.context.pushBuffer(maskBuffer);
                let maskMatrix = Matrix.create();
                const maskConcatenatedMatrix = mask.$getConcatenatedMatrix();
                maskMatrix.copyFrom(maskConcatenatedMatrix);
                mask.$getConcatenatedMatrixAt(displayObject, maskMatrix);
                maskMatrix.translate(-displayBoundsX, -displayBoundsY);
                maskBuffer.setTransform(maskMatrix.a, maskMatrix.b, maskMatrix.c, maskMatrix.d, maskMatrix.tx, maskMatrix.ty);
                Matrix.release(maskMatrix);
                //
                if (egret.transformRefactor) {
                    mask.transformAsRenderRoot(0, 0, maskBuffer.globalMatrix);
                    mask.transform(0, 0);
                }
                drawCalls += this._webglRender.drawDisplayObject(mask, maskBuffer, 0, 0);
                maskBuffer.context.popBuffer();
                displayBuffer.context.setGlobalCompositeOperation("destination-in");
                displayBuffer.setTransform(1, 0, 0, -1, 0, maskBuffer.height);
                let maskBufferWidth = maskBuffer.rootRenderTarget.width;
                let maskBufferHeight = maskBuffer.rootRenderTarget.height;
                displayBuffer.debugCurrentRenderNode = null;
                displayBuffer.context.drawTexture(maskBuffer.rootRenderTarget.texture, 0, 0, maskBufferWidth, maskBufferHeight,
                    0, 0, maskBufferWidth, maskBufferHeight, maskBufferWidth, maskBufferHeight);
                displayBuffer.setTransform(1, 0, 0, 1, 0, 0);
                displayBuffer.context.setGlobalCompositeOperation("source-over");
                maskBuffer.setTransform(1, 0, 0, 1, 0, 0);
                renderBufferPool.push(maskBuffer);
            }

            displayBuffer.context.setGlobalCompositeOperation(defaultCompositeOp);
            displayBuffer.context.popBuffer();

            //绘制结果到屏幕
            if (drawCalls > 0) {
                drawCalls++;
                const buffer = state.renderTarget;
                let hasBlendMode = (displayObject.$blendMode !== 0);
                let compositeOp: string;
                if (hasBlendMode) {
                    compositeOp = blendModes[displayObject.$blendMode];
                    if (!compositeOp) {
                        compositeOp = defaultCompositeOp;
                    }
                }
                if (hasBlendMode) {
                    buffer.context.setGlobalCompositeOperation(compositeOp);
                }
               
                let savedMatrix = Matrix.create();
                let curMatrix = buffer.globalMatrix;
                savedMatrix.a = curMatrix.a;
                savedMatrix.b = curMatrix.b;
                savedMatrix.c = curMatrix.c;
                savedMatrix.d = curMatrix.d;
                savedMatrix.tx = curMatrix.tx;
                savedMatrix.ty = curMatrix.ty;
                curMatrix.append(1, 0, 0, -1, offsetX + displayBoundsX, offsetY + displayBoundsY + displayBuffer.height);
                let displayBufferWidth = displayBuffer.rootRenderTarget.width;
                let displayBufferHeight = displayBuffer.rootRenderTarget.height;
                buffer.debugCurrentRenderNode = null;
                buffer.context.drawTexture(displayBuffer.rootRenderTarget.texture, 0, 0, displayBufferWidth, displayBufferHeight,
                    0, 0, displayBufferWidth, displayBufferHeight, displayBufferWidth, displayBufferHeight);
             
                if (hasBlendMode) {
                    buffer.context.setGlobalCompositeOperation(defaultCompositeOp);
                }
                let matrix = buffer.globalMatrix;
                matrix.a = savedMatrix.a;
                matrix.b = savedMatrix.b;
                matrix.c = savedMatrix.c;
                matrix.d = savedMatrix.d;
                matrix.tx = savedMatrix.tx;
                matrix.ty = savedMatrix.ty;
                Matrix.release(savedMatrix);
            }
            renderBufferPool.push(displayBuffer);
        }

        public pop(): void {
            const defaultMaskStack = this.defaultMaskStack;
            const state = defaultMaskStack.pop();
            if (state.enable) {
                if (state.isSpriteMask) {
                    //console.warn('MaskSystem: pop: state.isSpriteMask');
                    this.popSpriteMask(state);
                }
                else {
                    this.popScissorOrStencilMask(state);
                }
            }
            //清除，回池
            state.clear();
            this.statePool.push(state);
        }
    }
}