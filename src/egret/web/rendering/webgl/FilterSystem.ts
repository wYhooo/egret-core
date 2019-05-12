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
    class FilterState {

        public target: DisplayObject = null;
        public renderTexture: egret.web.WebGLRenderBuffer = null;
        public rootRenderTexture: egret.web.WebGLRenderBuffer = null;
        public filters: Array<Filter | CustomFilter> = [];
        public currentCompositeOp: string = '';
        public displayBoundsX: number = 0;
        public displayBoundsY: number = 0;
        public displayBoundsWidth: number = 0;
        public displayBoundsHeight: number = 0;
        public offsetX: number = 0;
        public offsetY: number = 0;

        constructor() {
        }

        public clear(): void {
            this.target = null;
            this.renderTexture = null;
            this.rootRenderTexture = null;
            this.filters = null;
            this.currentCompositeOp = '';
            this.displayBoundsX = 0;
            this.displayBoundsY = 0;
            this.displayBoundsWidth = 0;
            this.displayBoundsHeight = 0;
            this.offsetX = 0;
            this.offsetY = 0;
        }
    }

    /** !!!!!!!! inspired by pixi !!!!!!!!!!!!!
     */
    export class FilterSystem {

        private readonly statePool: FilterState[] = [];
        private readonly defaultFilterStack: FilterState[] = [];
        private activeState: FilterState = null;
        private readonly _webglRenderContext: WebGLRenderContext;

        constructor(webglRenderContext: WebGLRenderContext) {
            this.statePool = [];
            this.defaultFilterStack.push(new FilterState);
            this._webglRenderContext = webglRenderContext;
        }

        public push(target: DisplayObject, filters: Array<Filter | CustomFilter>, renderTargetRoot: WebGLRenderBuffer, offsetX: number, offsetY: number): void {
            //
            const filterStack = this.defaultFilterStack;
            const state = this.statePool.pop() || new FilterState();

            if (filterStack.length === 1) {
                this.defaultFilterStack[0].renderTexture = renderTargetRoot;
            }
            filterStack.push(state);

            //install
            state.target = target;
            //width, height
            const displayBounds = target.$getOriginalBounds();
            state.displayBoundsX = displayBounds.x;
            state.displayBoundsY = displayBounds.y;
            state.displayBoundsWidth = displayBounds.width;
            state.displayBoundsHeight = displayBounds.height;
            state.offsetX = offsetX;
            state.offsetY = offsetY;
            //render target
            state.renderTexture = this.getOptimalFilterTexture(displayBounds.width, displayBounds.height);
            state.rootRenderTexture = renderTargetRoot;
            state.filters = filters;
            //save blendFunc;
            state.currentCompositeOp = blendModes[target.$blendMode] || defaultCompositeOp;
            //active!!!
            if (filters.length === 1) {
                //设置filter
                const filters_0 = filters[0];
                if (!filters_0.post) {
                    /*
                    if (DEBUG) {
                        //
                        if (state.target.mask) {
                            console.warn('false: state.target.mask');
                        }
                        const condition2 = (!state.target.$children || this.___getRenderCount___(state.target) === 1);
                        if (!condition2) {
                            console.warn('false: (!state.target.$children || childrenDrawCount === 1)');
                        }
                        const isColorTransform = filters_0.type === "colorTransform";
                        const isCustomFilter = (filters_0.type === "custom" && (<CustomFilter>filters_0).padding === 0);
                        if (!isColorTransform && !isCustomFilter) {
                            console.warn('false: !isColorTransform && !isCustomFilter');
                        }
                    }
                    const _webglRenderContext = this._webglRenderContext;
                    _webglRenderContext.$filter = state.target.$_shader;//<ColorMatrixFilter | CustomFilter>filters_0;
                    //bind render target 直接往目标上画，不走framebuffer来回导手
                    _webglRenderContext.pushBuffer(state.rootRenderTexture);
                    _webglRenderContext.curFilterRenderTarget = state.rootRenderTexture;
                    //设置blend
                    _webglRenderContext.setGlobalCompositeOperation(state.currentCompositeOp);
                    */
                }
                else {
                    /*
                    //剩下的都是处理结果型的，不像ColorMatrixFilter和CustomFilter在精灵绘制的过程中进行改变
                    //bind render target 单独画一张图。
                    const targetTexture = state.renderTexture;
                    const _webglRenderContext = this._webglRenderContext;
                    _webglRenderContext.pushBuffer(targetTexture);
                    _webglRenderContext.curFilterRenderTarget = targetTexture;
                    _webglRenderContext.curFilterOffsetX = -state.displayBoundsX;
                    _webglRenderContext.curFilterOffsetY = -state.displayBoundsY;
                    //need transform
                    if (egret.transformRefactor) {
                        state.target.transformAsRenderRoot(-state.displayBoundsX, -state.displayBoundsY, targetTexture.globalMatrix);
                        state.target.transform(-state.displayBoundsX, -state.displayBoundsY);
                    }
                    */
                }
            }
            else {
                console.log('push: filters.length = ' + filters.length);
                const targetTexture = state.renderTexture;
                const _webglRenderContext = this._webglRenderContext;
                _webglRenderContext.pushBuffer(targetTexture);
            }
        }

        public pop(): void {
            //
            const filterStack = this.defaultFilterStack;
            const state = filterStack.pop();
            const lastState = filterStack[filterStack.length - 1];
            const filters = state.filters;
            this.activeState = state;
            //
            if (filters.length === 1) {
                /*
                const filters_0 = filters[0];
                const _webglRenderContext = this._webglRenderContext;
                //
                if (filters_0.post) {
                    //unbind
                    _webglRenderContext.popBuffer();
                }
                else {
                    //nothing
                }
                //
                this.applyFilter(filters_0, state.renderTexture, lastState.renderTexture, false, state);
                //
                if (filters_0.post) {
                    //nothing
                }
                else {
                    _webglRenderContext.setGlobalCompositeOperation(defaultCompositeOp);
                    _webglRenderContext.$filter = null;
                    //unbind
                    _webglRenderContext.popBuffer();
                }
                //这三个临时变量不要了
                _webglRenderContext.curFilterRenderTarget = null;
                _webglRenderContext.curFilterOffsetX = 0;
                _webglRenderContext.curFilterOffsetY = 0;
                //return 不管用没用，都还回去
                this.returnFilterTexture(state.renderTexture);
                state.renderTexture = null;
                */
            }
            else {
                console.log('pop: filters.length = ' + filters.length);
                const _webglRenderContext = this._webglRenderContext;
                _webglRenderContext.popBuffer();
                //
                _webglRenderContext.setGlobalCompositeOperation(state.currentCompositeOp);
                let input = state.renderTexture;
                const filtersLen = filters.length;
                if (filtersLen > 1) {
                    for (let i = 0; i < filtersLen - 1; i++) {
                        let filter = filters[i];
                        let width = state.displayBoundsWidth;
                        let height = state.displayBoundsHeight;
                        let output = this.getOptimalFilterTexture(width, height);
                        output.setTransform(1, 0, 0, 1, 0, 0);
                        output.globalAlpha = 1;
                        //this.drawToRenderTarget(filter, input, output);
                        output.debugCurrentRenderNode = null;//do not render using renderNode
                        _webglRenderContext.___drawToRenderTarget___(filter, input, output);
                        this.returnFilterTexture(input);
                        input = output;
                    }
                }

                // 应用最后一个滤镜并绘制到当前场景中
                let filter = filters[filtersLen - 1];
                lastState.renderTexture.debugCurrentRenderNode = null;//do not render using renderNode
                _webglRenderContext.___drawToRenderTarget___(filter, input, lastState.renderTexture);
                this.returnFilterTexture(input);

                _webglRenderContext.setGlobalCompositeOperation(defaultCompositeOp);
                _webglRenderContext.$filter = null;
                //这三个临时变量不要了
                _webglRenderContext.curFilterRenderTarget = null;
                _webglRenderContext.curFilterOffsetX = 0;
                _webglRenderContext.curFilterOffsetY = 0;
            }
            //清除，回池
            state.clear();
            this.statePool.push(state);
        }

        private getOptimalFilterTexture(minWidth: number, minHeight: number, resolution: number = 1): WebGLRenderBuffer {
            return this.__createRenderBuffer__(minWidth, minHeight);
        }

        public applyFilter(filter: Filter, input: WebGLRenderBuffer, output: WebGLRenderBuffer, clear: boolean, state: FilterState): void {
            //console.log('applyFilter = ' + filter.type + ', post = ' + filter.post);
            if (filter.post) {
                const _webglRenderContext = this._webglRenderContext;
                _webglRenderContext.setGlobalCompositeOperation(state.currentCompositeOp);
                // 绘制结果的时候，应用滤镜
                output.$offsetX = state.offsetX + state.displayBoundsX;
                output.$offsetY = state.offsetY + state.displayBoundsY;
                const savedMatrix = Matrix.create();
                const curMatrix = output.globalMatrix;
                savedMatrix.a = curMatrix.a;
                savedMatrix.b = curMatrix.b;
                savedMatrix.c = curMatrix.c;
                savedMatrix.d = curMatrix.d;
                savedMatrix.tx = curMatrix.tx;
                savedMatrix.ty = curMatrix.ty;
                const savedOffsetX = output.$offsetX;
                const savedOffsetY = output.$offsetY;
                output.useOffset();
                output.debugCurrentRenderNode = null;//do not render using renderNode
                _webglRenderContext.___drawToRenderTarget___(filter, input, output);
                curMatrix.a = savedMatrix.a;
                curMatrix.b = savedMatrix.b;
                curMatrix.c = savedMatrix.c;
                curMatrix.d = savedMatrix.d;
                curMatrix.tx = savedMatrix.tx;
                curMatrix.ty = savedMatrix.ty;
                output.$offsetX = savedOffsetX;
                output.$offsetY = savedOffsetY;
                Matrix.release(savedMatrix);
                _webglRenderContext.setGlobalCompositeOperation(defaultCompositeOp);
            }
            else {
            }
        }

        private returnFilterTexture(renderTexture: WebGLRenderBuffer): void {
            WebGLRenderBuffer.release(renderTexture);
        }

        private __createRenderBuffer__(width: number, height: number): WebGLRenderBuffer {
            return WebGLRenderBuffer.create(width, height);
        }

        private ___getRenderCount___(displayObject: DisplayObject): number {
            let drawCount = 0;
            const node = displayObject.$getRenderNode();
            if (node) {
                drawCount += node.$getRenderCount();
            }
            if (displayObject.$children) {
                for (const child of displayObject.$children) {
                    const filters = child.$filters;
                    // 特殊处理有滤镜的对象
                    if (filters && filters.length > 0) {
                        return 2;
                    }
                    else if (child.$children) {
                        drawCount += this.___getRenderCount___(child);
                    }
                    else {
                        const node = child.$getRenderNode();
                        if (node) {
                            drawCount += node.$getRenderCount();
                        }
                    }
                }
            }
            return drawCount;
        }
    }
}