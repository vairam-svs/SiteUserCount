using Microsoft.Owin;
using Owin;

[assembly: OwinStartupAttribute(typeof(SiteUserCount.Startup))]
namespace SiteUserCount
{
    public partial class Startup {
        public void Configuration(IAppBuilder app) {
            ConfigureAuth(app);
        }
    }
}
