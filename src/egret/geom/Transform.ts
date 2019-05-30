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

namespace egret {

    //
    export class Transform {
        public readonly globalMatrix = new Matrix;
        public offsetX: number = 0;
        public offsetY: number = 0;
        public _localID = 0;
        public _currentLocalID = 0;
        public _worldID = 0;
        public _parentID = 0;

        public clear(): void {
            this.globalMatrix.identity();
            this.offsetX = 0;
            this.offsetY = 0;
        }

        public onLocalChange(): void {
            ++this._localID;
        }

        public onParentChange(): void {
            this._parentID = -1;
        }

        public appendOffsetMatrix(): void {
            if (this.offsetX !== 0 || this.offsetY !== 0) {
                this.globalMatrix.append(1, 0, 0, 1, this.offsetX, this.offsetY);
                this.offsetX = 0;
                this.offsetY = 0;
            }
        }

        public transform(_matrix_: Matrix, offetX: number, offsetY: number): void {
            //globalMatrix = globalMatrix * _matrix_[a: number, b: number, c: number, d: number, tx: number, ty: number]
            const matrix = this.globalMatrix;
            const a1 = matrix.a;
            const b1 = matrix.b;
            const c1 = matrix.c;
            const d1 = matrix.d;
            //
            const a = _matrix_.a;
            const b = _matrix_.b;
            const c = _matrix_.c;
            const d = _matrix_.d;
            const tx = _matrix_.tx + offetX;
            const ty = _matrix_.ty + offsetY;
            //
            if (a !== 1 || b !== 0 || c !== 0 || d !== 1) {
                matrix.a = a * a1 + b * c1;
                matrix.b = a * b1 + b * d1;
                matrix.c = c * a1 + d * c1;
                matrix.d = c * b1 + d * d1;
            }
            matrix.tx = tx * a1 + ty * c1 + matrix.tx;
            matrix.ty = tx * b1 + ty * d1 + matrix.ty;
        }
    }
}