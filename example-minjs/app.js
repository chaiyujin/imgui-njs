
var AppName = "Imgui-njs Example App";
var AppVersion = "1.0.0";

class SimpleTest
{
    constructor()
    {
        this.counter = 0;
        this.curr_iframe = 0;
        this.frame_image = null;
    }

    Show(imgui, winname="imgui demo", isOpen=null)
    {
        if(isOpen != null && !isOpen.get()) return;
        let done = false;
        let winflags = this.getWinFlags();

        this.imgui = imgui;
        this.log = GetLog(imgui);
        if(!this.styleEditor)
        {
            this.styleEditor = new StyleEditor(imgui);
            this.demoWidgets = new DemoWidgets(imgui);
            this.demoLayout = new DemoLayout(imgui);
            this.demoPopups = new DemoPopups(imgui);
            this.demoColumns = new DemoColumns(imgui);
            this.customRendering = new DemoCustomRendering(imgui);
        }

        // if(this.noClose.get())
        //     isOpen = null;

        imgui.SetNextWindowPos(new Vec2(40, 40), CondFlags.FirstUseEver);
        imgui.SetNextWindowSize(new Vec2(500, 700), CondFlags.FirstUseEver);

        if(!imgui.Begin(winname, isOpen, winflags))
        {
            imgui.End();
            return done;
        }

        // Use fixed width for labels (by passing a negative value),
        // the rest goes to widgets. We choose a width proportional
        // to our font size.
        imgui.PushItemWidth(imgui.GetFontSize() * -12);
        if (imgui.Button("Button")) // Buttons return true when clicked
            this.counter++;
        imgui.SameLine();
        imgui.PushFont("monospace");
        imgui.Text(`counter=${this.counter}`);
        imgui.SameLine();
        let fps = imgui.GetIO().Framerate;
        let ms = (1000.0 / fps).toFixed(1);
        imgui.Text(`${fps.toFixed(0)} fps, ${ms} mspf`);
        let mouse = imgui.GetIO().MousePos;
        if(mouse.x != -Number.MAX_VALUE)
        {
            imgui.SameLine();
            imgui.Text(`mouse: ${mouse.x}, ${mouse.y}`);
        }
        imgui.PopFont();

        imgui.SliderInt("##Player:slider", this.curr_iframe, 1, 100, null,
                        (newval)=>this.curr_iframe=newval);
        let url = "./test.jpg";
        // imgui.Image(url, new Vec2(740, 426));
        imgui.Image(this.frame_image, new Vec2(740, 426));
        imgui.End();
        return done;
    }


    getWinFlags()
    {
        let winflags = 0;
        // if(this.noTitleBar.get())
        //     winflags |= WindowFlags.NoTitleBar;
        // if(this.noScrollBar.get())
        //     winflags |= WindowFlags.NoScrollbar;
        // if(!this.noMenu.get())
        //     winflags |= WindowFlags.MenuBar;
        // if(this.noResize.get())
        //     winflags |= WindowFlags.NoResize;
        // if(this.noCollapse.get())
        //     winflags |= WindowFlags.NoCollapse;
        // if(this.noNav.get())
        //     winflags |= WindowFlags.NoNav;
        // if(this.noBgd.get())
        //     winflags |= WindowFlags.NoBackground;
        // if(this.noBringToFront.get())
        //     winflags |= WindowFlags.NoBringToFrontOnFocus;
        return winflags;
    }

}


class Application extends ImguiApp
{
    constructor(id, appname)
    {
        super(id, appname, AppVersion);
        this.demo = null;
    }

    Begin(onReady)
    {
        super.Begin((err) =>
        {
            if(!err)
            {
                this.player = new SimpleTest(this.imgui);
            }
            if(onReady)
                onReady(err);
        });
    }

    OnFrame(imgui)
    {
        // there is where cycles are distributed to your widgets
        // ImguiApp owns log and demo windows.
        if(this.player)
            this.player.Show(imgui);
    }
}
