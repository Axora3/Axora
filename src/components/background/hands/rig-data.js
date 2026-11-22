// Pixel-space joint guides on the restored painted assets. These never alter
// the artwork itself; they drive a continuous, alpha-masked 2D skin mesh.
export const guides=[
 {side:'left',url:'/images/animated-hands/left-painted-v2.png',wrist:[565,310],palm:[875,200],
  fingers:{
   index:{points:[[1100,105],[1280,115],[1415,150],[1510,175]],radii:[65,47,34],angles:[-4.8,-2.1,1.4]},
   thumb:{points:[[815,265],[975,315],[1120,350],[1210,375]],radii:[76,54,35],angles:[2.0,2.8,-1.2]},
   middle:{points:[[1070,178],[1195,230],[1310,275],[1380,315]],radii:[50,37,25],angles:[3.1,4.2,-1.8]},
   ring:{points:[[1035,225],[1135,285],[1225,327],[1280,354]],radii:[39,30,23],angles:[-2.4,3.8,1.3]},
   pinky:{points:[[975,260],[1050,330],[1110,392],[1140,435]],radii:[39,29,22],angles:[2.4,3.5,-1.6]},
  },tipRegion:{x:[1410,1536],y:[90,245]}},
 {side:'right',url:'/images/animated-hands/right-painted.png',wrist:[920,440],palm:[650,575],
  fingers:{
   index:{points:[[395,620],[257,655],[140,690],[50,725]],radii:[56,43,30],angles:[4.3,2.2,-1.4]},
   thumb:{points:[[695,600],[555,665],[430,740],[345,809]],radii:[75,57,39],angles:[-2.8,-2.0,1.2]},
   middle:{points:[[565,750],[425,845],[382,925],[412,991]],radii:[56,39,28],angles:[-3.6,3.3,-1.6]},
   ring:{points:[[625,760],[483,822],[453,910],[455,965]],radii:[44,35,24],angles:[2.8,3.2,-1.3]},
   pinky:{points:[[696,750],[563,798],[559,863],[585,913]],radii:[41,31,25],angles:[3.1,2.7,-1.1]},
  },tipRegion:{x:[0,155],y:[640,795]}},
];
