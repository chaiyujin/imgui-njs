
var AppName = "Imgui-njs Example App";
var AppVersion = "1.0.0";

class Application extends ImguiApp
{
    constructor()
    {
        super(AppName, AppVersion);
        this.demo = null;
    }

    Begin(onReady)
    {
        super.Begin((err) =>
        {
            if(!err)
            {
                this.demo = new DemoWindow(this.imgui);
            }
            if(onReady)
                onReady(err);
        });
    }

    OnFrame(imgui)
    {
        // there is where cycles are distributed to your widgets
        // ImguiApp owns log and demo windows.
        if(this.demo)
            this.demo.Show(imgui);
    }
}
