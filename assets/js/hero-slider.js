/*==========================================================
  FLORIN HERO SLIDER
==========================================================*/

class HeroSlider {

    constructor() {

        this.current = 0;

        this.interval = null;

        this.delay = 5000;

        this.slides = [

            {
                image: "assets/images/hero/hero-1.webp",
                alt: "Dubai"
            },

            {
                image: "assets/images/hero/hero-2.webp",
                alt: "Maldives"
            },

            {
                image: "assets/images/hero/hero-3.webp",
                alt: "Istanbul"
            },

            {
                image: "assets/images/hero/hero-4.webp",
                alt: "Makkah"
            },

            {
                image: "assets/images/hero/hero-5.webp",
                alt: "Egypt"
            }

        ];

        this.container = document.querySelector(".hero-slider");

        this.wrapper = null;

        this.dots = null;

    }

    init() {

        if (!this.container) return;

        this.createSlider();

        this.showSlide(0);

        this.start();

    }

    createSlider() {

        // سنقوم ببنائه في الخطوة التالية

    }

    showSlide(index) {

        // سيتم تنفيذها لاحقاً

    }

    next() {

        // سيتم تنفيذها لاحقاً

    }

    prev() {

        // سيتم تنفيذها لاحقاً

    }

    start() {

        // سيتم تنفيذها لاحقاً

    }

    stop() {

        // سيتم تنفيذها لاحقاً

    }

}

document.addEventListener("DOMContentLoaded", () => {

    const hero = new HeroSlider();

    hero.init();

});
