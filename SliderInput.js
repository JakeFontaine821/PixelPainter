class SliderInput extends HTMLElement{
    constructor(){
        super();

        this.classList.add('slider-input');

        const showBounds = this.hasAttribute('showbounds');
        const min = this.getAttribute('min') ?? 0;
        const max = this.getAttribute('max') ?? 1;
        const startValue = parseFloat(this.getAttribute('value')) ?? null;
        this.decimalPlaces = this.getAttribute('decimalplaces') ?? 0;

        this.innerHTML = `
            ${showBounds ? `<div class="min-container">${min}</div>` : ''}
            <div class="slider-container">
                <div class="bar-background"></div>
                <div class="bar-fill"></div>
                <div class="nob"></div>
                <div class="value-popup hidden"></div>
            </div>
            ${showBounds ? `<div class="max-container">${max}</div>` : ''}
        `;

        this.min = parseFloat(min);
        this.range = max - min;

        const bar = this.querySelector('.bar-background');
        const barFill = this.querySelector('.bar-fill');
        const nob = this.querySelector('.nob');
        this.barBoundingBox = bar.getBoundingClientRect();

        const valuePopup = this.querySelector('.value-popup');
        this.mouseHovering = false;
        this.nobMoving = false;
        
        // Takes in a mouse event and moves the nob to where the mouse is
        const convertMouseLocToOffset = (e) => {
            const xOffset = Math.max( 0, Math.min(this.barBoundingBox.width, e.clientX - this.barBoundingBox.left));
            nobMover(xOffset);
        };

        // Takes in just the pixel offset, can be used to set a value directily (idk how to spell it)
        const nobMover = (offset) => {
            nob.style.left = offset;
            barFill.style.width = offset;
            valuePopup.style.left = offset;

            const rawValue = (offset / this.barBoundingBox.width) * this.range + this.min;
            this.value = this.decimalPlaces ? parseFloat(rawValue.toFixed(this.decimalPlaces)) : Math.round(rawValue);
            if(this.value === this.lastValue){ return; }

            this.lastValue = this.value;
            valuePopup.innerText = this.value;
            this.dispatchEvent(new Event('change'));
        };

        bar.addEventListener('mousedown', convertMouseLocToOffset);

        // handle value popup window
        nob.addEventListener('mouseenter', () => {
            this.mouseHovering = true;
            valuePopup.classList.remove('hidden');
        });
        nob.addEventListener('mouseleave', () => {
            this.mouseHovering = false;
            this.hideValuePopup();
        });

        // clicked to drag the nob
        nob.addEventListener('mousedown', () => {
            window.addEventListener('mousemove', convertMouseLocToOffset);
            window.addEventListener('mouseup', () => {
                window.removeEventListener('mousemove', convertMouseLocToOffset);

                this.nobMoving = false;
                this.hideValuePopup();
            }, { once: true });

            this.nobMoving = true;
        });

        // Set the bar to starting value (if set)
        nobMover(startValue ? (startValue - this.min) / this.range * this.barBoundingBox.width : 0);
    };

    // ShowValuePopup(){
    //     if()
    // };

    hideValuePopup(){
        if(!this.mouseHovering && !this.nobMoving){ this.querySelector('.value-popup').classList.add('hidden'); }
    };
};
customElements.define('slider-input', SliderInput);