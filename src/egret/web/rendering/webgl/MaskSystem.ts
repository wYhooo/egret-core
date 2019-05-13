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

        public target: DisplayObject = null;
        public renderTexture: egret.web.WebGLRenderBuffer = null;
        public offsetX: number = 0;
        public offsetY: number = 0;
        public scissor: boolean = false;
        public x: number = 0;
        public y: number = 0;
        public width: number = 0;
        public height: number = 0;

        constructor() {
        }

        public clear(): void {
            this.target = null;
            this.renderTexture = null;
            this.offsetX = 0;
            this.offsetY = 0;
            this.scissor = false;
            this.x = 0;
            this.y = 0;
            this.width = 0;
            this.height = 0;
        }
    }

    /** !!!!!!!! inspired by pixi !!!!!!!!!!!!!
    */
    export class MaskSystem {

        private readonly _webglRenderContext: WebGLRenderContext;
        private readonly statePool: MaskState[] = [];
        private readonly defaultMaskStack: MaskState[] = [];

        constructor(webglRenderContext: WebGLRenderContext) {
            this._webglRenderContext = webglRenderContext;
        }

        public push(target: DisplayObject, renderTargetRoot: WebGLRenderBuffer,
            offsetX: number, offsetY: number,
            _drawAdvancedTargetData: IDrawAdvancedTargetData): void {

            //
            const defaultMaskStack = this.defaultMaskStack;
            const state = this.statePool.pop() || new MaskState();
            defaultMaskStack.push(state);
            //
            // const displayObject = target;
            // const buffer = renderTargetRoot;
            if (target.$mask) {
                console.warn('MaskSystem: push: displayObject.$mask');
            }
            else {
                this.pushScissorOrStencilMask(state, target, renderTargetRoot, offsetX, offsetY, _drawAdvancedTargetData);
            }
        }

        private pushScissorOrStencilMask(state: MaskState,
            displayObject: DisplayObject,
            buffer: WebGLRenderBuffer,
            offsetX: number, offsetY: number,
            _drawAdvancedTargetData: IDrawAdvancedTargetData): void {

            //let drawCalls = 0;
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
            state.target = displayObject;
            state.renderTexture = buffer;
            state.offsetX = offsetX;
            state.offsetY = offsetY;
            state.scissor = false;
            //????
            _drawAdvancedTargetData.renderTarget = buffer;
            _drawAdvancedTargetData.offsetX = offsetX;
            _drawAdvancedTargetData.offsetY = offsetY;
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
            //need transform
            if (egret.transformRefactor) {
                state.target.transformAsRenderRoot(state.offsetX, state.offsetY, state.renderTexture.globalMatrix);
                state.target.transform(state.offsetX, state.offsetY);
            }
        }

        public pop(): void {
            const defaultMaskStack = this.defaultMaskStack;
            const state = defaultMaskStack.pop();
            if (state.scissor) {
                //context.disableScissor();
                this._webglRenderContext.disableScissor();
            } else {
                //context.popMask();
                this._webglRenderContext.popMask();
            }

            //清除，回池
            state.clear();
            this.statePool.push(state);
        }
    }
}