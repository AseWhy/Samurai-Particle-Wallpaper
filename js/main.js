const GRAP = document.getElementById("GRAPHICHS"),
      CONT = GRAP.getContext("2d"),
      SETTINGS = {
        max_particles: 300,
        delta_wait: 1000 / 60,
        particle_size: 2,
        td_show: true,
        fps_show: false,
        draw_audio: true,
        fps: {
            color: "#000000",
            font_size: 16,
            font_family: "monospace"
        },
        date: {
            color: "#000000",
            font_size: 72,
            font_family: "Linetoline"
        },
        time: {
            color: "#000000",
            font_size: 34,
            font_family: "Linetoline"
        }
      }

//normalize canvas
GRAP.width = document.body.offsetWidth;
GRAP.height = document.body.offsetHeight;


/**
 *
 * Processes an image, receives pixel data
 *
 *
 * @param img - cur image
 * @return imageData
 */
var getBimap = (img) => {
        var canvas = document.createElement("canvas");
        var context = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0);
        return context.getImageData(0, 0, img.width, img.height);
},
push_image = (data, chunck_size, width, height, empty = 255*3) => {
    var x = 0,
        y = 0,
        line_buffer = [],
        particles = [],
        cur = null,
        dump = GRAP.height / SETTINGS.max_particles,
        line_dump = Math.floor(dump),
        on_line_dump = 1;

    if(line_dump <= 0){
        line_dump = 1;
        on_line_dump = Math.floor(SETTINGS.max_particles / GRAP.height)
    }

    for(var i = 0;i < data.data.length;i += 4){
        y = Math.floor((i / 4) / data.width);
        x = (i / 4) - (y * data.width);

        if(data.data[i]+data.data[i+1]+data.data[i+2] !== empty &&
             line_buffer[y] === undefined &&
             (y % line_dump) === 0 &&
             data.data[i+(4*5)]){
            line_buffer[y] = x;
            
            for(var j = 0;j < on_line_dump;j++){
                cur = new Particle(
                    Math.floor(x * (width / data.width)),
                    Math.floor(y * (height / data.height)),
                    chunck_size,
                    chunck_size,
                    170,
                    {
                        r: data.data[i+(4*5)],
                        g: data.data[i+(4*5)+1],
                        b: data.data[i+(4*5)+2]
                    }
                );

                particles.push(cur);
            }
        }
    }

    return particles;
},
formate_date = (date) => {
    return {
        date: (date.getDate() < 10 ? "0" + date.getDate() : date.getDate()) + "." + (date.getMonth() + 1 < 10 ? "0" + (date.getMonth() + 1) : (date.getMonth() + 1 )) + "." + date.getFullYear(),
        time: (date.getHours() < 10 ? "0" + date.getHours() : date.getHours())  + ":" +  (date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes())  + ":" + (date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds())
    }
},
prepare_to_render = (bitmap) => {
    var canvas = document.createElement("canvas"),
        ctx = canvas.getContext("2d");

        canvas.width = bitmap.width;
        canvas.height = bitmap.height;

    for(var i = 0;i < bitmap.data.length;i+=4){
        if(bitmap.data[i] > 230 && bitmap.data[i+1] > 230 && bitmap.data[i+2] > 230){
            bitmap.data[i+3] = 0;
        }
    }

    ctx.putImageData(bitmap, 0, 0)

    return canvas;
};

(()=>{
    var pointer_y = 0;
        clear_img = new Image(),
        clear_img_btm = null,
        date = null,
        particles = [],
        bg_bitmap = null,
        draw_buffer = [],
        last_buffer = [],
        rects = 80,
        delta_width = 0,
        fps = "",
        frames = 0,
        inited = false,
        delta = 0;

    function ClearBG(){
        clear_img.src = background;
    }
    ClearBG();

    setInterval(()=>{
        if(SETTINGS.fps_show === true){
            fps = frames + " (fps) " + particles.length + "(particles)";
        }
        frames = 0;
    }, 1000);

    function draw(){
        pointer_y = 0;
        if(SETTINGS.delta_wait != 1000 / 60){
            setTimeout(() => requestAnimationFrame(draw), SETTINGS.delta_wait);
        }else{
            requestAnimationFrame(draw)
        }

        CONT.clearRect(0, 0, GRAP.width, GRAP.height);
        CONT.fillStyle = "#fff"
        CONT.fillRect(0, 0, GRAP.width, GRAP.height)

        date = formate_date(new Date());

        if(SETTINGS.td_show === true){
            CONT.font = SETTINGS.date.font_size + "px " + SETTINGS.date.font_family;

            CONT.fillStyle = SETTINGS.date.color;

            delta = CONT.measureText(date.date).width;

            CONT.fillText(date.date, GRAP.width - delta - (SETTINGS.date.font_size * 0.2), SETTINGS.date.font_size);
            
            pointer_y += SETTINGS.date.font_size;

            CONT.font = SETTINGS.time.font_size + "px " + SETTINGS.time.font_family;

            CONT.fillStyle = SETTINGS.time.color;

            CONT.fillText(date.time, GRAP.width - CONT.measureText(date.time).width - (SETTINGS.date.font_size * 0.2), pointer_y + SETTINGS.time.font_size);
        }

        //Draw particles
        for(var i = 0;i < particles.length;i++){
            particles[i].Draw(CONT);
        }

        if(SETTINGS.fps_show === true){
            CONT.font = SETTINGS.fps.font_size + "px " + SETTINGS.fps.font_family;
            CONT.fillStyle = SETTINGS.fps.color;
            CONT.fillText(fps, GRAP.width - CONT.measureText(fps).width - 5, GRAP.height - 5);
        }

        if(SETTINGS.draw_audio === true){
            delta_width = (GRAP.width / 2) / (rects) - 2;
            delta = 0;
            CONT.fillStyle = "#000"
            for(var i = 0;i < rects;i++){
                CONT.fillRect(GRAP.width * 0.25 + delta, GRAP.height * 0.5 - (draw_buffer[i] / 2), delta_width, draw_buffer[i])
                delta += delta_width + 2;
            }
        }

        CONT.drawImage(clear_img_btm, 0, 0, GRAP.width, GRAP.height);

        frames++;
    }

    clear_img.onload = () => {
        if(inited){
            var bitmap = getBimap(clear_img);
            clear_img_btm = prepare_to_render(bitmap);
            return;
        }

        var bitmap = getBimap(clear_img);
        particles = push_image(bitmap, SETTINGS.particle_size, GRAP.width, GRAP.height);
        clear_img_btm = prepare_to_render(bitmap);
        inited = true;

        draw();
    };


    window.wallpaperRegisterAudioListener && window.wallpaperRegisterAudioListener(data => {
        if(SETTINGS.draw_audio === true){
            for(var i = 0;i < rects;i++){
                draw_buffer[i] = i < Math.round(rects / 2) ? 
                (data[Math.round((i / rects) * 128)] / 1.5) * (GRAP.height * 0.5) :
                draw_buffer[(rects - i - 1)];

                if(draw_buffer[i] < last_buffer[i]){
                    draw_buffer[i] = last_buffer[i]*0.85
                }else if(last_buffer[i] !== undefined && last_buffer[i] !== 0) {
                    draw_buffer[i] = last_buffer[i]*1.15
                }

                if(Math.round(draw_buffer[i]) === 0)
                        draw_buffer[i] = 0

                last_buffer[i] = draw_buffer[i];
            }
        }
    });

    //fps_max
    window.wallpaperPropertyListener = {
        applyUserProperties: (properties) => {
            SETTINGS.fps_show = properties.fps_show != undefined ? properties.fps_show.value : SETTINGS.fps_show;
            SETTINGS.td_show = properties.td_show != undefined ? properties.td_show.value : SETTINGS.td_show;
            SETTINGS.draw_audio = properties.show_audio != undefined ? properties.show_audio.value : SETTINGS.draw_audio;
            SETTINGS.max_particles = properties.max_particles != undefined ?!isNaN(parseInt(properties.max_particles.value)) ? parseInt(properties.max_particles.value) : SETTINGS.max_particles : SETTINGS.max_particles;
            SETTINGS.particle_size = properties.particle_size != undefined ?!isNaN(parseInt(properties.particle_size.value)) ? parseInt(properties.particle_size.value) : SETTINGS.particle_size : SETTINGS.particle_size;
            SETTINGS.delta_wait = properties.fps_max != undefined ?!isNaN(parseInt(properties.fps_max.value)) ? 1000 / parseInt(properties.fps_max.value) : SETTINGS.fps_max : SETTINGS.fps_max;
            
            particles = push_image(getBimap(clear_img), SETTINGS.particle_size, GRAP.width, GRAP.height);
        }
    }
})()