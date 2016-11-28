<%@ Page Language="C#" AutoEventWireup="true"  CodeBehind="TestClickDelay.aspx.cs" Inherits="SiteUserCount.TestClickDelay" %>

<!DOCTYPE html>

<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
    <title></title>
    <script type="text/javascript" src="Scripts/jquery-1.10.2.min.js"></script>
    <script type="text/javascript" src="Scripts/jquery.override.js"></script>
    <script type="text/javascript">
        //http://www.quirksmode.org/js/events_order.html
        var baseURL = "http://localhost:58743/"
        $(document).ready(function () {
            alert("hello");
            //$('a').removeAttr('onclick');
            //$("a").each(function (item) {
            //    item.onclick = null;
            //    item.click(function () { alert("done") });
            //});

            $(function () {
                $('a').each(function () {
                    var $this = $(this);
                    var click = $this.attr('onclick');
                    if (click) {
                        //click = "setTimeOut( function() {" + click + "}, 3000);";
                        click = "alert('hello'); return ShoppingCartContinue();";
                        alert(click);
                        //$this.data('click', click);
                        var theInstructions = "alert('hello');this.preventDefault();this.stopPropagation(); return ShoppingCartContinue();";

                        var F = new Function(theInstructions);

                        //return (F());
                        // add return false to prevent default action
                        $this[0].onclick = F;
                        //function () {
                        //    alert('hello');
                        //    return ShoppingCartContinue();
                        //};
                    }
                });

                $('#restoreClick').click(function () {
                    $('a.disabled').each(function () {
                        var $this = $(this);
                        $this.removeClass('disabled');
                        var click = $this.data('click');
                        if (click) {
                            $this[0].onclick = click;
                        }
                    });
                });
            });

                //$('#restoreClick').click(function () {
                //    $('a').each(function () {
                //        var $this = $(this);
                //        //$this.removeClass('disabled');
                //        var click = $this.data('click');
                //        if (click) {
                //            $this[0].onclick = click;
                //        }
                //    });
                //});
            

            //$("a").override('onclick', 'click', function (oldFunction, element, arguments) {
            //    if (newBehavior) {
            //        alert('new behavior only.');
            //    } else {
            //        setTimeout(function () {
            //            alert('waited 3 seconds');
            //            oldFunction(); //will invoke passing 'this' and 'arguments'  
            //        }, 3000);
            //    }
            //});
        });

        //$('a').removeAttr('onclick');
        //alert($("#lnkshoppingcart").attr('click'));
        //$("#lnkshoppingcart").addEventListener('click', function (event) {
        //    event.preventDefault();
        //    event.stopPropagation();
        //    alert("stopped;")
        //    setTimeout(function () {
        //        alert("waited for 3 seconds");
        //        location.href = baseURL + this.href;
        //    }, 3000);
        //}, true);

        //$.each($("#lnkshoppingcart").data("events"), function (i, e) {
        //    alert(i);
        //});
        var processTime = 100;
        function wait(ms) {
            var start = Date.now(),
                now = start;
            while (now - start < ms) {
                now = Date.now();
            }
            alert("delayed for " + ms.toString() + " 3 seconds");
        }
        function CheckOutContinue() {
            wait(60000);
            alert("clicked");
            return false;
        }
        function ShoppingCartContinue(event) {
            alert("continue");
            return false;
        }
        function PdpPageContinue() {
            wait(3000);
            alert("clicked");
            return true;
        }
        function execEval()
        {
            var theInstructions = "return ShoppingCartContinue();";

            var F = new Function(theInstructions);

            return (F());
        }
    </script>
</head>
<body>

    <form id="form1" runat="server">
    <div>
    <a runat="server" href="~/Checkout.aspx" onclick="return CheckOutContinue();" >CheckOut</a>
    </div>
    <div>
    <a runat="server" href="~/ShoppingCart.aspx" id="lnkshoppingcart" onclick="return ShoppingCartContinue(this);" >View Shopping Cart</a>
    </div>
    <div>
    <a runat="server" href="~/PdpPage.aspx" >Product Detail</a>
    </div>
        <div>
    <a href="#" onclick="alert('panic!')">Let's panic</a>
    <a href="#" onclick="alert('panic!')" class="disabled">I can't panic no more</a>
    <button onclick="execEval();">execeval</button>
</div>
    </form>
</body>
</html>
