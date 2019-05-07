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
        public renderTextureRoot: egret.web.WebGLRenderBuffer = null;
        public filters: Array<Filter | CustomFilter> = [];
        public currentCompositeOp: string = '';
        public displayBoundsX: number = 0;
        public displayBoundsY: number = 0;
        public displayBoundsWidth: number = 0;
        public displayBoundsHeight: number = 0;

        constructor() {
        }

        public clear(): void {
            this.target = null;
            this.renderTexture = null;
            this.renderTextureRoot = null;
            this.filters = null;
            this.currentCompositeOp = '';
            this.displayBoundsX = 0;
            this.displayBoundsY = 0;
            this.displayBoundsWidth = 0;
            this.displayBoundsHeight = 0;
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

        public push(target: DisplayObject, filters: Array<Filter | CustomFilter>, renderTargetRoot: WebGLRenderBuffer): void {
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
            //render target
            state.renderTexture = this.getOptimalFilterTexture(displayBounds.width, displayBounds.height);
            state.renderTextureRoot = renderTargetRoot;
            state.filters = filters;
            //save blendFunc;
            state.currentCompositeOp = blendModes[target.$blendMode] || defaultCompositeOp;
            //active!!!
            if (filters.length === 1) {
                //设置filter
                const filters_0 = filters[0];
                if (!filters_0.post) {
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
                    _webglRenderContext.$filter = <ColorMatrixFilter | CustomFilter>filters_0;
                    //bind render target 直接往目标上画，不走framebuffer来回导手
                    _webglRenderContext.pushBuffer(state.renderTextureRoot);
                    _webglRenderContext.currentFilterSystemRenderTarget = state.renderTextureRoot;
                    //设置blend
                    _webglRenderContext.setGlobalCompositeOperation(state.currentCompositeOp);
                }
                else {
                    //剩下的都是处理结果型的，不像ColorMatrixFilter和CustomFilter在精灵绘制的过程中进行改变
                    //bind render target 单独画一张图。
                    const targetTexture = state.renderTexture;
                    const _webglRenderContext = this._webglRenderContext;
                    _webglRenderContext.pushBuffer(targetTexture);
                    _webglRenderContext.currentFilterSystemRenderTarget = targetTexture;
                    _webglRenderContext.currentFilterSystemRenderTargetOffsetX = -state.displayBoundsX;
                    _webglRenderContext.currentFilterSystemRenderTargetOffsetY = -state.displayBoundsY;
                    //need transform
                    if (egret.transformRefactor) {
                        state.target.transformAsRenderRoot(-state.displayBoundsX, -state.displayBoundsY, targetTexture.globalMatrix);
                        state.target.transform(-state.displayBoundsX, -state.displayBoundsY);
                    }
                }
            }
            else {

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
                const filters_0 = filters[0];
                this.applyFilter(filters_0, state.renderTexture, lastState.renderTexture, false, state);
                if (!filters_0.post) {
                    this._webglRenderContext.setGlobalCompositeOperation(defaultCompositeOp);
                    this._webglRenderContext.$filter = null;
                }
                else {

                }
                //unbind
                this._webglRenderContext.popBuffer();
                this._webglRenderContext.currentFilterSystemRenderTarget = null;
                this._webglRenderContext.currentFilterSystemRenderTargetOffsetX = 0;
                this._webglRenderContext.currentFilterSystemRenderTargetOffsetY = 0;
                //return 不管用没用，都还回去
                this.returnFilterTexture(state.renderTexture);
                state.renderTexture = null;
            }
            else {
            }
            //
            state.clear();
            this.statePool.push(state);
        }

        private getOptimalFilterTexture(minWidth: number, minHeight: number, resolution: number = 1): WebGLRenderBuffer {
            return this.__createRenderBuffer__(minWidth, minHeight);
        }

        public applyFilter(filter: Filter, input: WebGLRenderBuffer, output: WebGLRenderBuffer, clear: boolean, state: FilterState): void {
            console.log('applyFilter = ' + filter.type + ', post = ' + filter.post);
            if (!filter.post) {
                
            }
            else {
                
            }
            /*
            const renderer = this.renderer;

            renderer.renderTexture.bind(output, output ? output.filterFrame : null);

            if (clear)
            {
                // gl.disable(gl.SCISSOR_TEST);
                renderer.renderTexture.clear();
                // gl.enable(gl.SCISSOR_TEST);
            }

            // set the uniforms..
            filter.uniforms.uSampler = input;
            filter.uniforms.filterGlobals = this.globalUniforms;

            // TODO make it so that the order of this does not matter..
            // because it does at the moment cos of global uniforms.
            // they need to get resynced

            renderer.state.setState(filter.state);
            renderer.shader.bind(filter);

            if (filter.legacy)
            {
                this.quadUv.map(input._frame, input.filterFrame);

                renderer.geometry.bind(this.quadUv);
                renderer.geometry.draw(DRAW_MODES.TRIANGLES);
            }
            else
            {
                renderer.geometry.bind(this.quad);
                renderer.geometry.draw(DRAW_MODES.TRIANGLE_STRIP);
            }
            */
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