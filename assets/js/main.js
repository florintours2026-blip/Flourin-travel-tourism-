"use strict";

/* ==========================================================
   FLORIN TOURS - MAIN.JS
========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    initializeLoader();

    initializeStickyHeader();

    initializeTheme();

    initializeLanguage();

    initializeMobileMenu();

    initializeScrollTop();

    initializeReveal();

});

/* ==========================================================
LOADER
========================================================== */

function initializeLoader(){

    const loader=document.getElementById("loader");

    if(!loader) return;

    window.addEventListener("load",()=>{

        loader.style.opacity="0";

        loader.style.visibility="hidden";

        setTimeout(()=>{

            loader.remove();

        },500);

    });

}

/* ==========================================================
STICKY HEADER
========================================================== */

function initializeStickyHeader(){

    const header=document.querySelector(".navbar");

    if(!header) return;

    window.addEventListener("scroll",()=>{

        if(window.scrollY>60){

            header.classList.add("scrolled");

        }else{

            header.classList.remove("scrolled");

        }

    });

}

/* ==========================================================
THEME
========================================================== */

function initializeTheme(){

    const button=document.getElementById("themeToggle");

    const saved=localStorage.getItem("florin-theme") || "dark";

    document.body.classList.toggle("light",saved==="light");

    if(!button) return;

    button.addEventListener("click",()=>{

        document.body.classList.toggle("light");

        localStorage.setItem(

            "florin-theme",

            document.body.classList.contains("light") ? "light":"dark"

        );

    });

}

/* ==========================================================
LANGUAGE
========================================================== */

function initializeLanguage(){

    const lang=document.getElementById("langToggle");

    if(!lang) return;

    let current=localStorage.getItem("florin-language") || "ar";

    lang.textContent=current.toUpperCase();

    lang.onclick=()=>{

        current=current==="ar" ? "en":"ar";

        localStorage.setItem("florin-language",current);

        location.reload();

    };

}

/* ==========================================================
MOBILE MENU
========================================================== */

function initializeMobileMenu(){

    const button=document.querySelector(".mobile-menu");

    const nav=document.querySelector(".nav-links");

    if(!button || !nav) return;

    button.onclick=()=>{

        nav.classList.toggle("active");

    };

}

/* ==========================================================
SCROLL TOP
========================================================== */

function initializeScrollTop(){

    const top=document.getElementById("scrollTop");

    if(!top) return;

    window.addEventListener("scroll",()=>{

        if(window.scrollY>400){

            top.classList.add("show");

        }else{

            top.classList.remove("show");

        }

    });

    top.onclick=()=>{

        window.scrollTo({

            top:0,

            behavior:"smooth"

        });

    };

}

/* ==========================================================
REVEAL ANIMATION
========================================================== */

function initializeReveal(){

    const elements=document.querySelectorAll(".fade-up");

    if(!elements.length) return;

    const observer=new IntersectionObserver(entries=>{

        entries.forEach(entry=>{

            if(entry.isIntersecting){

                entry.target.classList.add("visible");

            }

        });

    },{

        threshold:.15

    });

    elements.forEach(el=>observer.observe(el));

          }
