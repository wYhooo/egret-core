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

    /** !!!!!!!!inspired by pixi!!!!!!!!!!!!!
     */
    class FilterState {

        public target: DisplayObject = null;
        public renderTexture: egret.web.WebGLRenderBuffer = null;
        public filters: Array<Filter | CustomFilter> = [];
        public currentCompositeOp: string = '';
        public displayBoundsWidth: number = 0;
        public displayBoundsHeight: number = 0;
        public debugPopEnable: boolean = true;

        constructor() {
        }

        public clear(): void {
            this.target = null;
            this.renderTexture = null;
            this.filters = null;
            this.currentCompositeOp = '';
            this.displayBoundsWidth = 0;
            this.displayBoundsHeight = 0;
            this.debugPopEnable = true;
        }
    }

    /** !!!!!!!!   inspired by pixi  !!!!!!!!!!!!!
    */
    export class FilterSystem {

        private readonly statePool: FilterState[] = [];
        private readonly defaultFilterStack: FilterState[] = [];
        private activeState: FilterState = null;

        constructor() {
            //this.defaultFilterStack.push(new FilterState);
            this.statePool = [];
        }

        public push(target: DisplayObject, filters: Array<Filter | CustomFilter>, renderTargetAsWebGLRenderBuffer: WebGLRenderBuffer): void {
            /*
            const renderer = this.renderer;
            */
            const filterStack = this.defaultFilterStack;
            const state = this.statePool.pop() || new FilterState();
            /*
            let resolution = filters[0].resolution;
            let padding = filters[0].padding;
            let autoFit = filters[0].autoFit;
            let legacy = filters[0].legacy;
    
            for (let i = 1; i < filters.length; i++) {
                const filter = filters[i];
    
                // lets use the lowest resolution..
                resolution = Math.min(resolution, filter.resolution);
                // and the largest amount of padding!
                padding = Math.max(padding, filter.padding);
                // only auto fit if all filters are autofit
                autoFit = autoFit || filter.autoFit;
    
                legacy = legacy || filter.legacy;
            }
            */
            // if (filterStack.length === 1) {
            //     filterStack[0].renderTexture = renderTargetAsWebGLRenderBuffer;//renderer.renderTexture.current;
            // }
            filterStack.push(state);
            /*
            state.resolution = resolution;
            state.legacy = legacy;
            */
            state.target = target;

            /*
            state.sourceFrame.copyFrom(target.filterArea || target.getBounds(true));
    
            state.sourceFrame.pad(padding);
            if (autoFit) {
                state.sourceFrame.fit(this.renderer.renderTexture.sourceFrame);
            }
    
            // round to whole number based on resolution
            state.sourceFrame.ceil(resolution);
            */
            state.renderTexture = renderTargetAsWebGLRenderBuffer;//this.getOptimalFilterTexture(state.displayBoundsWidth, state.displayBoundsHeight/*state.sourceFrame.width, state.sourceFrame.height, resolution*/);
            //
            state.filters = filters;
            /*
            state.destinationFrame.width = state.renderTexture.width;
            state.destinationFrame.height = state.renderTexture.height;
            state.renderTexture.filterFrame = state.sourceFrame;
            */

            /*
            renderer.renderTexture.bind(state.renderTexture, state.sourceFrame);// /, state.destinationFrame);
            renderer.renderTexture.clear();
            */
            state.renderTexture.context.pushBuffer(state.renderTexture);

            //save blendFunc;
            //let hasBlendMode = (target.$blendMode !== 0);
            //let compositeOp: string;
            if (target.$blendMode !== 0) {
                state.currentCompositeOp = blendModes[target.$blendMode] || defaultCompositeOp;
            }

            //
            const displayBounds = target.$getOriginalBounds();
            state.displayBoundsWidth = displayBounds.width;
            state.displayBoundsHeight = displayBounds.height;

            //active!!!
            if (filters.length === 1) {
                let debugPopEnable = true;
                //
                if (DEBUG) {
                    //
                    if (state.target.mask) {
                        console.warn('state.target.mask');
                        debugPopEnable = false;
                    }
                    //
                    const condition1 = (filters[0].type == "colorTransform" || (filters[0].type === "custom" && (<CustomFilter>filters[0]).padding === 0));
                    if (!condition1) {
                        console.warn('(filters[0].type == "colorTransform" || (filters[0].type === "custom" && (<CustomFilter>filters[0]).padding === 0))');
                        debugPopEnable = false;
                    }
                    //
                    const childrenDrawCount = this.___getRenderCount___(state.target);
                    const condition2 = (!state.target.$children || childrenDrawCount === 1);
                    if (!condition2) {
                        console.warn('(!state.target.$children || childrenDrawCount === 1)');
                        debugPopEnable = false;
                    }
                }

                if (debugPopEnable) {
                    //
                    state.debugPopEnable = debugPopEnable;
                    //
                    const buffer = state.renderTexture;
                    //设置blend
                    if (state.currentCompositeOp !== '') {
                        buffer.context.setGlobalCompositeOperation(state.currentCompositeOp);
                    }
                    //设置filter
                    buffer.context.$filter = <ColorMatrixFilter>filters[0];
                }
                
            }
            else {

            }
        }

        public pop(): void {
            //
            const filterStack = this.defaultFilterStack;
            const state = filterStack.pop();
            const filters = state.filters;
            this.activeState = state;
            /*
            const globalUniforms = this.globalUniforms.uniforms;
    
            globalUniforms.outputFrame = state.sourceFrame;
            globalUniforms.resolution = state.resolution;
    
            const inputSize = globalUniforms.inputSize;
            const inputPixel = globalUniforms.inputPixel;
            const inputClamp = globalUniforms.inputClamp;
    
            inputSize[0] = state.destinationFrame.width;
            inputSize[1] = state.destinationFrame.height;
            inputSize[2] = 1.0 / inputSize[0];
            inputSize[3] = 1.0 / inputSize[1];
    
            inputPixel[0] = inputSize[0] * state.resolution;
            inputPixel[1] = inputSize[1] * state.resolution;
            inputPixel[2] = 1.0 / inputPixel[0];
            inputPixel[3] = 1.0 / inputPixel[1];
    
            inputClamp[0] = 0.5 * inputPixel[2];
            inputClamp[1] = 0.5 * inputPixel[3];
            inputClamp[2] = (state.sourceFrame.width * inputSize[2]) - (0.5 * inputPixel[2]);
            inputClamp[3] = (state.sourceFrame.height * inputSize[3]) - (0.5 * inputPixel[3]);
    
            // only update the rect if its legacy..
            if (state.legacy) {
                const filterArea = globalUniforms.filterArea;
    
                filterArea[0] = state.destinationFrame.width;
                filterArea[1] = state.destinationFrame.height;
                filterArea[2] = state.sourceFrame.x;
                filterArea[3] = state.sourceFrame.y;
    
                globalUniforms.filterClamp = globalUniforms.inputClamp;
            }
    
            this.globalUniforms.update();
            */
            //const lastState = filterStack[filterStack.length - 1];
            if (filters.length === 1) {

                if (state.debugPopEnable) {
                    const buffer = state.renderTexture;
                    buffer.context.$filter = null;
                    if (state.currentCompositeOp !== '') {
                        buffer.context.setGlobalCompositeOperation(defaultCompositeOp);
                    }
                }
                
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

        private returnFilterTexture(renderTexture: WebGLRenderBuffer): void {
            renderTexture.context.popBuffer();
            renderBufferPool.push(renderTexture);
        }

        private __createRenderBuffer__(width: number, height: number): WebGLRenderBuffer {
            let buffer = renderBufferPool.pop();
            if (buffer) {
                buffer.resize(width, height);
            }
            else {
                buffer = new WebGLRenderBuffer(width, height);
                buffer.$computeDrawCall = false;
            }
            return buffer;
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