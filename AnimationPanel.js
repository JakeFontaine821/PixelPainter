class AnimationCanvas{
    constructor(width, height){
        const canvas = document.createElement('canvas');
        canvas.setAttribute('width', `${width}px`);
        canvas.setAttribute('height', `${height}px`);

        canvas.numberOfCellsWidth = 16;
        canvas.numberOfCellsHeight = 16;
        canvas.drawScale = canvas.width / canvas.numberOfCellsWidth;

        canvas.strokeWidth = 1;
        canvas.outlineColor = '#000000';
        canvas.cellsArray = [[]];

        for(const propName of Object.getOwnPropertyNames(AnimationCanvas.prototype)){
            if(propName === 'constructor'){ continue; }
            if(typeof this[propName] === 'function'){ canvas[propName] = this[propName].bind(canvas); }
        }

        return canvas;
    };

    draw(cellsArray, outlineOptions={}){
        this.cellsArray = JSON.parse(JSON.stringify(cellsArray));
        this.outlineOptions = outlineOptions;

        const numberOfCellsHeight = cellsArray.length;
        const numberOfCellsWidth = cellsArray[0].length;
        const longerSide = numberOfCellsWidth > numberOfCellsHeight ? numberOfCellsWidth : numberOfCellsHeight;
        const scale = 128 / longerSide;

        const ctx = this.getContext('2d');
        ctx.clearRect(0, 0, this.width, this.height);

        // draw cells
        for(let y = 0; y < cellsArray.length; y++){
            for(let x = 0; x < cellsArray[y].length; x++){
                if(!cellsArray[y][x]){ continue; }
                ctx.fillStyle = cellsArray[y][x];
                ctx.fillRect(x*scale, y*scale, scale, scale);

                if(!outlineOptions.drawOutlines){ continue; }
                ctx.lineWidth = outlineOptions.strokeWidth;
                ctx.strokeStyle = outlineOptions.outlineColor;
                if(!cellsArray?.[y-1]?.[x]){ this.DrawLine(x*scale, y*scale, (x+1)*scale, y*scale); } // Above
                if(!cellsArray?.[y]?.[x-1]){ this.DrawLine(x*scale, y*scale, x*scale, (y+1)*scale); } // Left
                if(!cellsArray?.[y+1]?.[x]){ this.DrawLine(x*scale, (y+1)*scale, (x+1)*scale, (y+1)*scale); } // Below
                if(!cellsArray?.[y]?.[x+1]){ this.DrawLine((x+1)*scale, y*scale, (x+1)*scale, (y+1)*scale); } // Right
            }
        }
    };

    // This is really annoying to repeat for lines so just turning it into a function
    DrawLine(x1, y1, x2, y2){
        const ctx = this.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    };
};

class AnimationPanel extends HTMLElement{
    constructor(){
        super();

        this.classList.add('animation-panel');

        this.innerHTML = `
            <div class="settings-section">
                <div class="settings-left">
                    <div class="setting">
                        Select All
                        <toggle-switch class="select-all-toggle"></toggle-switch>
                    </div>
                    <div class="setting">
                        Number Of Frames:
                        <select class="number-of-frames-input">
                            <option>2</option>
                            <option>3</option>
                            <option selected>4</option>
                            <option>5</option>
                            <option>6</option>
                            <option>7</option>
                            <option>8</option>
                            <option>9</option>
                            <option>10</option>
                        </select>
                    </div>
                </div>
                <div class="settings-middle">
                    <div class="setting toggle-play-setting">
                        <svg class="play-button" xmlns="http://www.w3.org/2000/svg" height="22px" viewBox="0 -960 960 960" width="22px" fill="#e8eaed"><path d="M320-200v-560l440 280-440 280Zm80-280Zm0 134 210-134-210-134v268Z"/></svg>
                        <svg class="stop-button hidden" xmlns="http://www.w3.org/2000/svg" height="22px" viewBox="0 -960 960 960" width="22px" fill="#e8eaed"><path d="M320-640v320-320Zm-80 400v-480h480v480H240Zm80-80h320v-320H320v320Z"/></svg>
                    </div>
                </div>
                <div class="settings-right">
                    <div class="setting fps-row">
                        Frames per second: 
                        <slider-input class="fps-input" min="1" max="60" showbounds value="30"></slider-input>
                    </div>
                </div>
            </div>
            <div class="animation-row">
                <div class="frame-containers"></div>
                <div class="animation-result-container">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="m321-80-71-71 329-329-329-329 71-71 400 400L321-80Z"/></svg>
                </div>
            </div>
        `;

        this.frameCanvasWidth = 128;
        this.frameCanvasHeight = 128;

        const frameContainer = this.querySelector('.frame-containers');

        // Add starting animation canvases
        for (let i = 0; i < 4; i++) { frameContainer.appendChild(new AnimationCanvas(this.frameCanvasWidth, this.frameCanvasHeight)); }
        frameContainer.firstChild.classList.add('selected');

        // Create animation result canvas
        this.resultCanvas = new AnimationCanvas(this.frameCanvasWidth, this.frameCanvasHeight);
        this.querySelector('.animation-result-container').appendChild(this.resultCanvas);

        this.frameCanvases = Array.from(frameContainer.children);
        this.selectedIndex = 0;
        this.playingFrameIndex = 0;

        this.timePerFrame = 1000/30; // Set to 30 frames per second by default

        const selectAllToggle = this.querySelector('.select-all-toggle');
        selectAllToggle.addEventListener('change', () => {
            if(selectAllToggle.checked){
                for(const canvas of this.frameCanvases){ canvas.classList.add('selected'); }
                return;
            }

            for(const canvas of this.frameCanvases){ canvas.classList.remove('selected'); }
            this.frameCanvases[this.selectedIndex].classList.add('selected');
        });

        const numberOfFrameInputs = this.querySelector('.number-of-frames-input');
        numberOfFrameInputs.addEventListener('change', () => {
            while(frameContainer.children.length < numberOfFrameInputs.value){
                const newCanvas = new AnimationCanvas(this.frameCanvasWidth, this.frameCanvasHeight);

                newCanvas.addEventListener('click', () => {
                    for(const canvas of this.frameCanvases){ canvas.classList.remove('selected'); }
                    newCanvas.classList.add('selected');
                    this.selectedIndex = this.frameCanvases.findIndex(frame => frame === newCanvas);
    
                    selectAllToggle.checked = false;
                });

                newCanvas.addEventListener('dblclick', () => {
                    if(newCanvas.cellsArray.length < 16){ return; } // only copy from frame if cells have been set
                    this.dispatchEvent(Object.assign(new Event('copyfromframe'), {cellsArray: newCanvas.cellsArray, outlineOptions: newCanvas.outlineOptions}));
                });

                frameContainer.appendChild(newCanvas);
            }
            while(frameContainer.children.length > numberOfFrameInputs.value){ frameContainer.lastChild.remove(); }

            this.frameCanvases = Array.from(frameContainer.children);
            if(this.selectedIndex >= this.frameCanvases.length){ this.selectedIndex = this.frameCanvases.length-1; }
            if(this.playingFrameIndex >= this.frameCanvases.length){ this.playingFrameIndex = this.frameCanvases.length-1; }
        })

        for(const canvas of this.frameCanvases){
            canvas.addEventListener('click', () => {
                for(const canvas of this.frameCanvases){ canvas.classList.remove('selected'); }
                canvas.classList.add('selected');
                this.selectedIndex = this.frameCanvases.findIndex(frame => frame === canvas);

                selectAllToggle.checked = false;
            });

            canvas.addEventListener('dblclick', () => {
                if(canvas.cellsArray.length < 16){ return; } // only copy from frame if cells have been set
                this.dispatchEvent(Object.assign(new Event('copyfromframe'), {cellsArray: canvas.cellsArray, outlineOptions: canvas.outlineOptions}));
            });
        }

        const fpsInput = this.querySelector('.fps-input');
        fpsInput.addEventListener('change', () => this.timePerFrame = 1000 / fpsInput.value);

        const togglePlayButton = this.querySelector('.toggle-play-setting');
        const playButton = this.querySelector('.play-button');
        const stopButton = this.querySelector('.stop-button');
        this.playing = false;
        togglePlayButton.addEventListener('click', () => {
            this.playing = !this.playing;

            if(this.playing){
                playButton.classList.add('hidden');
                stopButton.classList.remove('hidden');
                
                const frameToDraw = this.frameCanvases[0];
                frameToDraw.classList.add('animating');
                this.resultCanvas.draw(frameToDraw.cellsArray, frameToDraw.outlineOptions);

                let lastFrameSwitch = Date.now();

                const Animation = () => {
                    if(!this.playing){ return; }

                    if(Date.now() - lastFrameSwitch >= this.timePerFrame){
                        this.frameCanvases[this.playingFrameIndex].classList.remove('animating');
                        this.playingFrameIndex = (this.playingFrameIndex + 1) % this.frameCanvases.length;

                        const frameToDraw = this.frameCanvases[this.playingFrameIndex];
                        frameToDraw.classList.add('animating');
                        this.resultCanvas.draw(frameToDraw.cellsArray, frameToDraw.outlineOptions);

                        lastFrameSwitch = Date.now();
                    }

                    window.requestAnimationFrame(Animation);
                };
                Animation();
            }
            else{
                playButton.classList.remove('hidden');
                stopButton.classList.add('hidden');
                this.playingFrameIndex = 0;
                
                const lastAnimated = frameContainer.querySelector('.animating');
                if(lastAnimated){ lastAnimated.classList.remove('animating'); }
            }
        });
    };

    DrawOnSelectedCanvas(cellsArray, outlineOptions={}){
        for(const canvas of this.frameCanvases.filter(canvas => canvas.classList.contains('selected'))){
            canvas.draw(cellsArray, outlineOptions);
        }
    };

    SetResolution(width, height){
        const numberOfCellsHeight = height;
        const numberOfCellsWidth = width;

        const longerSide = numberOfCellsWidth > numberOfCellsHeight ? numberOfCellsWidth : numberOfCellsHeight;
        const scale = 128 / longerSide;

        this.frameCanvasWidth = width*scale;
        this.frameCanvasHeight = height*scale;

        for(const canvas of this.frameCanvases){
            canvas.setAttribute('width', `${this.frameCanvasWidth}px`);
            canvas.setAttribute('height', `${this.frameCanvasHeight}px`);
        }

        this.resultCanvas.setAttribute('width', `${this.frameCanvasWidth}px`);
        this.resultCanvas.setAttribute('height', `${this.frameCanvasHeight}px`);
    };
};
customElements.define('animation-panel', AnimationPanel);