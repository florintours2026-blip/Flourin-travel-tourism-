class HeroSlider {
  constructor(){
    this.current=0;
    this.delay=5000;
    this.timer=null;
    this.el=document.querySelector('.hero-bg');
    this.images=[
      'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1920&q=85',
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1920&q=85',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920&q=85',
      'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1920&q=85'
    ];
  }
  init(){if(!this.el) return; this.show(0); this.start();}
  show(index){
    this.current=index%this.images.length;
    const next=this.images[this.current];
    this.el.classList.add('hero-bg-changing');
    const img=new Image();
    img.onload=()=>{this.el.style.backgroundImage=`url("${next}")`; requestAnimationFrame(()=>this.el.classList.remove('hero-bg-changing'));};
    img.src=next;
  }
  next(){this.show(this.current+1)}
  start(){this.stop();this.timer=setInterval(()=>this.next(),this.delay)}
  stop(){if(this.timer) clearInterval(this.timer)}
}
document.addEventListener('DOMContentLoaded',()=>new HeroSlider().init());
