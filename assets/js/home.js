"use strict";

/*==========================================================
FLORIN HOME.JS
==========================================================*/

document.addEventListener("DOMContentLoaded",()=>{

    initializeBookingTabs();

    initializeCounters();

    initializePartnersSlider();

    initializeHeroParallax();

    initializeSearchForm();

});

/*==========================================================
BOOKING TABS
==========================================================*/

function initializeBookingTabs(){

    const tabs=document.querySelectorAll(".search-tabs button");

    if(!tabs.length) return;

    tabs.forEach(button=>{

        button.addEventListener("click",()=>{

            tabs.forEach(btn=>btn.classList.remove("active"));

            button.classList.add("active");

        });

    });

}

/*==========================================================
COUNTERS
==========================================================*/

function initializeCounters(){

    const counters=document.querySelectorAll("[data-counter]");

    if(!counters.length) return;

    counters.forEach(counter=>{

        const target=parseInt(counter.dataset.counter);

        let value=0;

        const timer=setInterval(()=>{

            value+=Math.ceil(target/100);

            if(value>=target){

                value=target;

                clearInterval(timer);

            }

            counter.textContent=value.toLocaleString();

        },20);

    });

}

/*==========================================================
PARTNERS AUTO SLIDER
==========================================================*/

function initializePartnersSlider(){

    const slider=document.querySelector(".partners-slider");

    if(!slider) return;

    let position=0;

    setInterval(()=>{

        position+=1;

        slider.scrollTo({

            left:position,

            behavior:"smooth"

        });

        if(position>=slider.scrollWidth){

            position=0;

        }

    },40);

}

/*==========================================================
PARALLAX HERO
==========================================================*/

function initializeHeroParallax(){

    const hero=document.querySelector(".hero-image");

    if(!hero) return;

    window.addEventListener("scroll",()=>{

        hero.style.transform=`translateY(${window.scrollY*0.3}px)`;

    });

}

/*==========================================================
SEARCH FORM
==========================================================*/

function initializeSearchForm(){

    const form=document.querySelector(".booking-form");

    if(!form) return;

    form.addEventListener("submit",e=>{

        e.preventDefault();

        alert("تم استلام طلبك بنجاح وسيتم التواصل معك.");

    });

}
