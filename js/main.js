/**
 * @file        main.js
 *              Here the appearance of the desktop 
 *              is formed, audio visualization, and
 *              other rendering
 * 
 * @author      FFDP P1ramidka
 * @version     0.3 
 * @license     MIT
 */

const GRAP = document.getElementById("GRAPHICHS"),
      CONT = GRAP.getContext("2d");

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
/**
 *
 * Checks every line of the image if 
 * it does not come across an 
 * empty pixel, puts the particle 
 * emitter in its place
 *
 *
 * @param data - image data
 * @param chunck_size - is particle size
 * @param width - canvas width
 * @param height - canvas height
 * @return imageData
 */
push_image = (data, chunck_size, width, height) => {
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

        if((data.data[i] <= SETTINGS.white_border && data.data[i+1] <= SETTINGS.white_border && data.data[i+2] <= SETTINGS.white_border) &&
             line_buffer[y] === undefined &&
             (y % line_dump) === 0){
            line_buffer[y] = x;
            
            for(var j = 0;j < on_line_dump;j++){
                cur = new Particle(
                    Math.floor(x * (width / data.width)),
                    Math.floor(y * (height / data.height)),
                    chunck_size,
                    chunck_size,
                    170,
                    {
                        r: data.data[i],
                        g: data.data[i+1],
                        b: data.data[i+2]
                    }
                );

                particles.push(cur);
            }
        }
    }

    return particles;
},
/**
 * Returns a formatted date
 * 
 * @param date - is a Date object
 * @return Object {
 *  date - is a formatted date
 *  time - is a formatted time 
 * }
 */
formate_date = (date) => {
    return {
        date: (date.getDate() < 10 ? "0" + date.getDate() : date.getDate()) + "." + (date.getMonth() + 1 < 10 ? "0" + (date.getMonth() + 1) : (date.getMonth() + 1 )) + "." + date.getFullYear(),
        time: (date.getHours() < 10 ? "0" + date.getHours() : date.getHours())  + ":" +  (date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes())  + ":" + (date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds())
    }
},
/**
 * Prepares the image for rendering, removes empty pixels, in 
 * the future the goals of this function may change
 * 
 * @param bitmap - is a ImageData object
 * @return a canvas ready for rendering
 */
prepare_to_render = (bitmap) => {
    var canvas = document.createElement("canvas"),
        ctx = canvas.getContext("2d");

        canvas.width = bitmap.width;
        canvas.height = bitmap.height;

    for(var i = 0;i < bitmap.data.length;i+=4){
        if(bitmap.data[i] > SETTINGS.white_border && bitmap.data[i+1] > SETTINGS.white_border && bitmap.data[i+2] > SETTINGS.white_border){
            bitmap.data[i+3] = 0;
        }
    }

    ctx.putImageData(bitmap, 0, 0)

    return canvas;
},
/**
 * Gets the local file in the url path and 
 * returns base64 in the callback
 * 
 * @param url - file url
 * @param res - is response callback 
 * @param warn - is error callback
 * @return base64 in the callback
 */
GetB64FromFile = (url, res, warn) => {
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'blob';
    request.onload = function() {
        var reader = new FileReader();
        reader.readAsDataURL(request.response);
        reader.onload =  function(e){
            res(e.target.result);
        };
        reader.onerror = warn;
    };
    request.onerror = warn;
    request.send();
},
/**
 * Gets an array with r g b values ​​and returns 
 * a formatted string for rendering
 * 
 * @param rgb - is array[3] = [r, g, b]
 * @return rgba(r, g, b, a)
 */
get_color = (rgb) => {
    SETTINGS.audio_devade.pract = {
        r: rgb[0],
        g: rgb[1],
        b: rgb[2]
    };
    rgb = [
        parseFloat(rgb[0]) * 255,
        parseFloat(rgb[1]) * 255,
        parseFloat(rgb[2]) * 255
    ];
    
    return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${(SETTINGS.audio_devade.opacity / 255)})`;
},
average = arr => arr.reduce((sume, el) => sume + el, 0) / arr.length;


(() => {
    var pointer_y = 0;
        clear_img = new Image(),
        clear_img_btm = null,
        date = null,
        particles = [],
        bg_bitmap = null,
        draw_buffer = [],
        last_buffer = [],
        sm_buffer = [],
        rects = 80,
        delta_width = 0,
        fps = "",
        frames = 0,
        delta = 0,
        max_value = 0,
        iterations = 0;

    const MaxAudioHeight = GRAP.height * 0.3;

    clear_img.src = localStorage.customBG === undefined ? background : 
    (JSON.parse(localStorage.customBG).size_of === true ? JSON.parse(localStorage.customBG).url : background);

    function ChangeBG(src){
        var img = new Image();
        img.src = src;
        img.onload = () => {
            var bitmap = getBimap(img);
            particles = push_image(bitmap, SETTINGS.particle_size, GRAP.width, GRAP.height);
            clear_img_btm = prepare_to_render(bitmap);
            clear_img = img;
            if(src.length < 4000000){
                localStorage.customBG = JSON.stringify({
                    size_of: true,
                    url: src,
                });
            }else{
                localStorage.customBG = JSON.stringify({
                    size_of: false,
                });
            }
        }
    }

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
        CONT.fillStyle = "#ffffff"
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
            switch(SETTINGS.avt){
            case 0:
                delta_width = (GRAP.width / 2) / (rects) - 2;
                delta = 0;
                CONT[SETTINGS.avt_fill ? "fillStyle" : "strokeStyle"] = SETTINGS.audio_devade.color;
                for(var i = 0;i < rects;i++){
                    SETTINGS.avt_fill ? 
                        CONT.fillRect(GRAP.width * 0.25 + delta + SETTINGS.avt_center.x, GRAP.height * 0.5 - (last_buffer[i] / 2) + SETTINGS.avt_center.y, delta_width, draw_buffer[i]) :
                        CONT.strokeRect(GRAP.width * 0.25 + delta + SETTINGS.avt_center.x, GRAP.height * 0.5 - (last_buffer[i] / 2) + SETTINGS.avt_center.y, delta_width, draw_buffer[i])
                    delta += delta_width + 2;
                }
                break;
            case 1:
                delta_width = 360 / rects;
                delta = 0;
                CONT[SETTINGS.avt_fill ? "fillStyle" : "strokeStyle"] = SETTINGS.audio_devade.color;
                CONT.beginPath();
                for(var i = 0;i < rects;i++){
                    CONT.lineTo((Math.cos(delta_width * (i - 0.8) * (Math.PI / 180)) * (SETTINGS.avt_radius)) + (GRAP.width / 2) + SETTINGS.avt_center.x,
                                (Math.sin(delta_width * (i - 0.8) * (Math.PI / 180)) * (SETTINGS.avt_radius)) + (GRAP.height / 2) + SETTINGS.avt_center.y);
                    CONT.lineTo((Math.cos(delta_width * (i - 0.8) * (Math.PI / 180)) * (last_buffer[i] + SETTINGS.avt_radius)) + (GRAP.width / 2) + SETTINGS.avt_center.x,
                                (Math.sin(delta_width * (i - 0.8) * (Math.PI / 180)) * (last_buffer[i] + SETTINGS.avt_radius)) + (GRAP.height / 2) + SETTINGS.avt_center.y);
                    CONT.lineTo((Math.cos(delta_width * (i - 0.2) * (Math.PI / 180)) * (last_buffer[i] + SETTINGS.avt_radius)) + (GRAP.width / 2) + SETTINGS.avt_center.x,
                                (Math.sin(delta_width * (i - 0.2) * (Math.PI / 180)) * (last_buffer[i] + SETTINGS.avt_radius)) + (GRAP.height / 2) + SETTINGS.avt_center.y);
                    CONT.lineTo((Math.cos(delta_width * (i - 0.2) * (Math.PI / 180)) * (SETTINGS.avt_radius)) + (GRAP.width / 2) + SETTINGS.avt_center.x,
                                (Math.sin(delta_width * (i - 0.2) * (Math.PI / 180)) * (SETTINGS.avt_radius)) + (GRAP.height / 2) + SETTINGS.avt_center.y);
                }
                CONT.closePath();
                SETTINGS.avt_fill ? CONT.fill() : CONT.stroke();
                break;
            case 2:
                delta_width = 360 / rects;
                delta = 0;
                CONT[SETTINGS.avt_fill ? "fillStyle" : "strokeStyle"] = SETTINGS.audio_devade.color;
                for(var i = 0;i < rects;i++){
                    CONT.beginPath();
                    CONT.lineTo((Math.cos(delta_width * (i - 0.8) * (Math.PI / 180)) * (SETTINGS.avt_radius)) + (GRAP.width / 2) + SETTINGS.avt_center.x,
                                (Math.sin(delta_width * (i - 0.8) * (Math.PI / 180)) * (SETTINGS.avt_radius)) + (GRAP.height / 2) + SETTINGS.avt_center.y);
                    CONT.lineTo((Math.cos(delta_width * (i - 0.8) * (Math.PI / 180)) * (last_buffer[i] + SETTINGS.avt_radius)) + (GRAP.width / 2) + SETTINGS.avt_center.x,
                                (Math.sin(delta_width * (i - 0.8) * (Math.PI / 180)) * (last_buffer[i] + SETTINGS.avt_radius)) + (GRAP.height / 2) + SETTINGS.avt_center.y);
                    CONT.lineTo((Math.cos(delta_width * (i - 0.2) * (Math.PI / 180)) * (last_buffer[i] + SETTINGS.avt_radius)) + (GRAP.width / 2) + SETTINGS.avt_center.x,
                                (Math.sin(delta_width * (i - 0.2) * (Math.PI / 180)) * (last_buffer[i] + SETTINGS.avt_radius)) + (GRAP.height / 2) + SETTINGS.avt_center.y);
                    CONT.lineTo((Math.cos(delta_width * (i - 0.2) * (Math.PI / 180)) * (SETTINGS.avt_radius)) + (GRAP.width / 2) + SETTINGS.avt_center.x,
                                (Math.sin(delta_width * (i - 0.2) * (Math.PI / 180)) * (SETTINGS.avt_radius)) + (GRAP.height / 2) + SETTINGS.avt_center.y);
                    CONT.closePath();
                    SETTINGS.avt_fill ? CONT.fill() : CONT.stroke();
                }
                break;
            }
        }

        CONT.drawImage(clear_img_btm, 0, 0, GRAP.width, GRAP.height);

        frames++;
    }

    clear_img.onload = () => {
        var bitmap = getBimap(clear_img);
        particles = push_image(bitmap, SETTINGS.particle_size, GRAP.width, GRAP.height);
        clear_img_btm = prepare_to_render(bitmap);
        draw();
        document.body.style.filter = "none";
    };

    window.wallpaperRegisterAudioListener && window.wallpaperRegisterAudioListener(data => {
        if(SETTINGS.draw_audio === true) {
            max_value = 0;
            for(var i = 0;i < data.length;i++){
                if(data[i] > max_value)
                    max_value = data[i];
            }
            
            //Normalize
            for(var i = 0;i < rects;i++){
                draw_buffer[i] = i < Math.round(rects / 2) ? 
                (data[Math.round((i / rects) * 128)] / max_value) * (MaxAudioHeight) :
                draw_buffer[(rects - i - 1)];

                if(SETTINGS.avt_smoothing === 0){
                    if(draw_buffer[i] < last_buffer[i] || max_value == 0){
                        draw_buffer[i] = last_buffer[i] - MaxAudioHeight*0.01;
                    }else if(draw_buffer[i] === last_buffer[i]){
                        continue;
                    }else if(last_buffer[i] !== undefined){
                        draw_buffer[i] = last_buffer[i] + MaxAudioHeight*0.01;
                    }
                }else if(SETTINGS.avt_smoothing === 1){
                    if(isNaN(draw_buffer[i]))
                        draw_buffer[i] = 0;

                    if(sm_buffer[i] == undefined)
                        sm_buffer[i] = [];

                    if(sm_buffer[i].length < SETTINGS.avt_smoothing_power){
                        sm_buffer[i].push(draw_buffer[i]);
                    }else if(sm_buffer[i].length > SETTINGS.avt_smoothing_power){
                        sm_buffer[i].splice(0, sm_buffer[i].length - SETTINGS.avt_smoothing_power + 1);
                        sm_buffer[i].push(draw_buffer[i]);
                    }else{
                        sm_buffer[i].splice(0, 1);
                        sm_buffer[i].push(draw_buffer[i]);
                    }

                    draw_buffer[i] = average(sm_buffer[i]);
                }else if(max_value == 0)
                    draw_buffer[i] = 0;

                if(Math.round(draw_buffer[i]) <= 0)
                    draw_buffer[i] = 0
                else if(draw_buffer[i] > MaxAudioHeight){
                    last_buffer[i] = MaxAudioHeight;
                    continue;
                }

                last_buffer[i] = draw_buffer[i];
            }
            iterations = 0;
        }
    });

    //fps_max
    window.wallpaperPropertyListener = {
        applyUserProperties: (properties) => {
            //Показывать фпс
            SETTINGS.fps_show = properties.fps_show != undefined ? 
                properties.fps_show.value : SETTINGS.fps_show;
            //Дата и время
            SETTINGS.td_show = properties.td_show != undefined ? 
                properties.td_show.value : SETTINGS.td_show;
            //Рисовать визуализацию
            SETTINGS.draw_audio = properties.show_audio != undefined ? 
                properties.show_audio.value : SETTINGS.draw_audio;
            //Мксимальное количество частиц
            SETTINGS.max_particles = properties.max_particles != undefined ? 
                !isNaN(parseInt(properties.max_particles.value)) ? parseInt(properties.max_particles.value) : SETTINGS.max_particles : SETTINGS.max_particles;
            //Размер частиц
            SETTINGS.particle_size = properties.particle_size != undefined ? 
                !isNaN(parseInt(properties.particle_size.value)) ? parseInt(properties.particle_size.value) : SETTINGS.particle_size : SETTINGS.particle_size;
            //Тип визуализации
            SETTINGS.avt = properties.audio_type != undefined ?
                !isNaN(parseInt(properties.audio_type.value)) ? parseInt(properties.audio_type.value) - 1 : SETTINGS.avt : SETTINGS.avt;
            //Радиус визуализации
            SETTINGS.avt_radius = properties.innerRadius != undefined ?
                !isNaN(parseInt(properties.innerRadius.value)) ? parseInt(properties.innerRadius.value) : SETTINGS.avt_radius : SETTINGS.avt_radius;
            //Непрозрачность
            SETTINGS.audio_devade.opacity = properties.audio_w_opacity != undefined ?
                !isNaN(parseInt(properties.audio_w_opacity.value)) ? parseInt(properties.audio_w_opacity.value) : SETTINGS.audio_devade.opacity : SETTINGS.audio_devade.opacity;
            //Смещение визуализации по x
            SETTINGS.avt_center.x = properties.audio_step_x != undefined ?
                !isNaN(parseInt(properties.audio_step_x.value)) ? parseInt(properties.audio_step_x.value) : SETTINGS.avt_center.x : SETTINGS.avt_center.x;
            //Смещение визуализации по y
            SETTINGS.avt_center.y = properties.audio_step_y != undefined ?
                !isNaN(parseInt(properties.audio_step_y.value)) ? parseInt(properties.audio_step_y.value) : SETTINGS.avt_center.y : SETTINGS.avt_center.y;
            //Цвет визуализации
            SETTINGS.audio_devade.color = properties.audio_w_color != undefined ?
                get_color(properties.audio_w_color.value.split(" ")) : SETTINGS.audio_devade.color;
            //Заливка визуализации
            SETTINGS.avt_fill = properties.audio_fill != undefined ?
                properties.audio_fill.value : SETTINGS.avt_fill;
            //Сглаживание аудио
            SETTINGS.avt_smoothing = properties.audio_smoothing != undefined ?
                properties.audio_smoothing.value - 1 : SETTINGS.avt_smoothing;
            //Сила сглаживания
            SETTINGS.avt_smoothing_power = properties.audio_smoothing_power != undefined ?
                properties.audio_smoothing_power.value : SETTINGS.avt_smoothing_power;

            if(properties.audio_w_opacity != undefined){
                SETTINGS.audio_devade.color = get_color(
                    [
                        SETTINGS.audio_devade.pract.r,
                        SETTINGS.audio_devade.pract.g,
                        SETTINGS.audio_devade.pract.b
                    ]
                )
            }

            if(properties.background != undefined){
                if(properties.background.value !== ""){
                    GetB64FromFile(decodeURIComponent("file:///" + properties.background.value), res => {
                        ChangeBG(res);
                    }, warn => {
                        alert("Mistake! I could not find the image in the given way, if you think that it is still there, write about it in the comments of the wallpaper, with a detailed description of the error.")
                        ChangeBG(background);
                    });
                } else {
                    ChangeBG(background);
                }
            } else {
                if(properties.particle_size != undefined || properties.max_particles != undefined)
                    particles = push_image(getBimap(clear_img), SETTINGS.particle_size, GRAP.width, GRAP.height);
            }
        }
    }
})()