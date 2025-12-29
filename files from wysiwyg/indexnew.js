   
   $(document).ready(function()
   {
      function skrollrInit()
      {
         skrollr.init({forceHeight: false, mobileCheck: function() { return false; }, smoothScrolling: false});
      }
      skrollrInit();
      $("#RollOverLayer2").click(function(e)
      {
         if (!$(this).hasClass('active'))
         {
            $(this).addClass('active');
            $('.default, .hover', this).removeClass('animate reverse').width();
            $('.default, .hover', this).addClass('animate');
         }
         else
         {
            $(this).removeClass('active');
            $('.default, .hover', this).removeClass('animate').width();
            $('.default, .hover', this).addClass('animate reverse');
         }
      });
      $("#RollOverLayer1").click(function(e)
      {
         if (!$(this).hasClass('active'))
         {
            $(this).addClass('active');
            $('.default, .hover', this).removeClass('animate reverse').width();
            $('.default, .hover', this).addClass('animate');
         }
         else
         {
            $(this).removeClass('active');
            $('.default, .hover', this).removeClass('animate').width();
            $('.default, .hover', this).addClass('animate reverse');
         }
      });
      $("#RollOverLayer3").click(function(e)
      {
         if (!$(this).hasClass('active'))
         {
            $(this).addClass('active');
            $('.default, .hover', this).removeClass('animate reverse').width();
            $('.default, .hover', this).addClass('animate');
         }
         else
         {
            $(this).removeClass('active');
            $('.default, .hover', this).removeClass('animate').width();
            $('.default, .hover', this).addClass('animate reverse');
         }
      });
   });
   
   $(document).ready(function()
   {
      $('#welcome').prepend('<div id="particles1"></div>');
    
    particlesJS("particles1",{particles:{number:{value:10,density:{enable:!0,value_area:800}},color:{value:"#FFFFFF"},shape:{type:"circle",stroke:{width:0,color:"#FFFFFF"},polygon:{nb_sides:5},image:{src:"",width:100,height:100}},opacity:{value:.505074,random:!0,anim:{enable:!1,speed:1,opacity_min:.1,sync:!1}},size:{value:100.213253,random:!0,anim:{enable:!0,speed:10,size_min:40,sync:!1}},line_linked:{enable:!1,distance:481.023618,color:"#FFFFFF",opacity:1,width:2},move:{enable:!0,speed:8,direction:"none",random:!1,straight:!1,out_mode:"out",bounce:!1,attract:{enable:!1,rotateX:600,rotateY:1200}}},interactivity:{detect_on:"canvas",events:{onhover:{enable:!1,mode:"bubble"},onclick:{enable:!1,mode:"push"},resize:!0},modes:{grab:{distance:431.568431,line_linked:{opacity:.364281}},bubble:{distance:263.73626373626377,size:55.944055,duration:2.157842,opacity:.335664,speed:3},repulse:{distance:239.760239,duration:.4},push:{particles_nb:4},remove:{particles_nb:2}}},retina_detect:!0});
   
   
   });
