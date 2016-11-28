using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace SiteUserCount
{
    public partial class _Default : Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            var cookieValue = Response.Cookies["BurlCheckoutWaitTime"];
            DateTime now = DateTime.Now;
            int waitTime = 300;
            DateTime expires = DateTime.Now.AddSeconds(300);
            if (cookieValue == null && Request.Cookies["BurlCheckoutWaitTime"] == null)
            {
                //BurlCheckoutWaitTime cookie does not exists in the http pipeline
                waitTime = 300 + now.Second;
                HttpCookie cookie = new HttpCookie("BurlCheckoutWaitTime", (waitTime).ToString());
                cookie.Expires = now.AddSeconds(waitTime);
                Response.Cookies.Add(cookie);
            }
            else if (cookieValue == null && Request.Cookies["BurlCheckoutWaitTime"] != null)
            {
                //its not there in the response yet, but user has a cookie in his browser.
                if (Request.Cookies["BurlCheckoutWaitTime"].Expires > DateTime.Now && !string.IsNullOrEmpty(Request.Cookies["BurlCheckoutWaitTime"].Value))
                {
                    expires = Request.Cookies["BurlCheckoutWaitTime"].Expires;
                    waitTime = Int32.Parse(Request.Cookies["BurlCheckoutWaitTime"].Value);
                }
                else
                {
                    waitTime = 300 + now.Second;
                    expires = now.AddSeconds(waitTime);
                }
                HttpCookie cookie = new HttpCookie("BurlCheckoutWaitTime", waitTime.ToString());
                cookie.Expires = expires;
                Response.Cookies.Add(cookie);
            }
            else if (cookieValue != null && string.IsNullOrEmpty(cookieValue.Value))
            {
                if (Request.Cookies["BurlCheckoutWaitTime"].Expires > DateTime.Now && !string.IsNullOrEmpty(Request.Cookies["BurlCheckoutWaitTime"].Value))
                {
                    expires = Request.Cookies["BurlCheckoutWaitTime"].Expires;
                    waitTime = Int32.Parse(Request.Cookies["BurlCheckoutWaitTime"].Value);
                }
                else
                {
                    waitTime = 300 + now.Second;
                    expires = now.AddSeconds(waitTime);
                }
                cookieValue.Expires = expires;
                cookieValue.Value = waitTime.ToString();
            }
        }
    }
}