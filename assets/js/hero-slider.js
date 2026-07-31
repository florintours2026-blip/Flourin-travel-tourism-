/*==========================================================
  FLORIN HERO SLIDER
==========================================================*/

class HeroSlider {

    constructor() {

        this.current = 0;

        this.delay = 5000;

        this.timer = null;

        this.slides = document.querySelectorAll(".hero-slide");

    }

    init() {

        if (!this.slides.length) return;

        this.showSlide(0);

        this.start();

    }

    showSlide(index) {

        this.slides.forEach(slide => {

            slide.classList.remove("active");

        });

        this.current = index;

        this.slides[this.current].classList.add("active");

    }

    next() {

        let index = this.current + 1;

        if (index >= this.slides.length) {

            index = 0;

        }

        this.showSlide(index);

    }

    prev() {

        let index = this.current - 1;

        if (index < 0) {

            index = this.slides.length - 1;

        }

        this.showSlide(index);

    }

    start() {

        this.stop();

        this.timer = setInterval(() => {

            this.next();

        }, this.delay);

    }

    stop() {

        if (this.timer) {

            clearInterval(this.timer);

        }

    }

}

document.addEventListener("DOMContentLoaded", () => {

    const slider = new HeroSlider();

    slider.init();

});
