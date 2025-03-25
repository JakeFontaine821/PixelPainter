class ToggleSwitch extends HTMLElement{
    constructor(){
        super();

        this.classList.add('toggle-switch');

        this.innerHTML = `
            <div class="switch"></div>
        `;

        this.addEventListener('click', () => {
            this.classList.toggle('checked');
            this.dispatchEvent(new Event('change'));
        });
    };

    get checked(){
        return this.classList.contains('checked');
    };

    set checked(checked){
        this.classList.toggle('checked', checked);
    }
};
customElements.define('toggle-switch', ToggleSwitch);