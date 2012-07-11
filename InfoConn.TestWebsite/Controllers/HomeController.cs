using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using InfoConn.Service;
using InfoConn.Core.Domain;
using InfoConn.Config;
using InfoConn.Core;
using InfoConn.Core.Common;
using InfoConn.Core.Authentication;
using System.IO;
using System.Web.Routing;
using System.Net;
using InfoConn.Connector.ICalendar;



namespace InfoConn.TestWebsite.Controllers
{
    public class HomeController : Controller
    {
        public int UserId{
            get
            {
                return int.Parse(HttpContext.Session["UserId"].ToString());                
            }
        } 

        AuthenticationFacebook oAuthFacbook = new AuthenticationFacebook(new SettingService());
        AuthenticationGoogle oAuthGoogle = new AuthenticationGoogle(new SettingService());

        public ActionResult Index()
        {
            ViewBag.Message = "KUYAM CALENDAR";
            return View();
        }

        public ActionResult fbCalendar()
        {
            InfoConnServiceReference.InfoConnSoapClient client = new InfoConnServiceReference.InfoConnSoapClient();
            var connectorSource = client.GetConnectorSource(UserId, InfoConnServiceReference.ConnectorSourceType.Facebook);

            if (connectorSource == null)
            {
                if (Request["code"] == null)
                {

                    return new RedirectResult(oAuthFacbook.AuthorizationLinkGet(), true);
                }
                else
                {
                    var conectorAuth = oAuthFacbook.AccessTokenGet(Request["code"]);
                    connectorSource = new InfoConnServiceReference.ConnectorSource
                    {
                        UserId = UserId,
                        AccessToken = conectorAuth.AccessToken,
                        RefressToken = conectorAuth.RefressToken,
                        ExpiresDate = conectorAuth.ExpiresDate,
                        ConnectorSourceType = (int)ConnectorSourceType.Facebook,
                        LastModified = DateTime.Now ,
                        IsUpdateRunning = false,
                        CacheLastUpdate_Short = DateTime.Now,
                        CacheLastUpdate_Longer = DateTime.Now,
                        CacheLastUpdate_Medium = DateTime.Now,
                        DoCacheUpdate_Longer = false,
                        DoCacheUpdate_Medium = false,
                        DoCacheUpdate_Short = false
                    };

                    client.AddConnectorSource(connectorSource);
                }
            }

            InfoConnServiceReference.SearchOption option = new InfoConnServiceReference.SearchOption();
            option.ConnectorSourceType = InfoConnServiceReference.ConnectorSourceType.Facebook;
            var model = client.GetEvents(UserId, option, InfoConnServiceReference.ConnectorSourceType.Facebook);

            return View(model);
        }

        [HttpPost]
        public ActionResult fbCalendar(string eventId, string fromDate, string toDate, string name, string location, string ept, string refresh)
        {

            InfoConnServiceReference.InfoConnSoapClient client = new InfoConnServiceReference.InfoConnSoapClient();
            InfoConnServiceReference.SearchOption option = new InfoConnServiceReference.SearchOption();
            option.EventId = eventId;
            option.Location = location;
            option.Name = name;
            option.ConnectorSourceType = InfoConnServiceReference.ConnectorSourceType.Facebook;
            if (!string.IsNullOrEmpty(fromDate))
                option.StartDate = Convert.ToDateTime(fromDate);
            if (!string.IsNullOrEmpty(toDate))
                option.EndDate = Convert.ToDateTime(toDate);
            List<InfoConn.TestWebsite.InfoConnServiceReference.Event> model = new List<InfoConn.TestWebsite.InfoConnServiceReference.Event>();

            var events = client.GetEvents(UserId, option, InfoConnServiceReference.ConnectorSourceType.Facebook);

            if (events != null)
            {
                foreach (var evt in events)
                {
                    model.Add(evt);
                }

            }
            if (ept == "Export")
            {
                Export(events);
            }

            if (refresh == "Refresh")
            {
                Refresh();
            }
            return View(model);
        }

        public void Export(InfoConn.TestWebsite.InfoConnServiceReference.Event[] eventList)
        {
            InfoConnServiceReference.InfoConnSoapClient client = new InfoConnServiceReference.InfoConnSoapClient();
            string filepath = Path.Combine(Server.MapPath("~/app_data/uploads"), string.Format("ics_export_{0}.ics", DateTime.Now.ToString("yyyyMMddhhmmssms")));
            if (client.ExportEvents(eventList, filepath))
            {
                
                Response.Clear();
                Response.ContentType = "application/ics";
                Response.AppendHeader("Content-Disposition", "attachment; filename=ics_export.ics");
                Response.TransmitFile(filepath);
                try
                {
                    Response.End();
                }
                catch (Exception ex) { }
            }
        }

        public void Refresh()
        { 
            InfoConnServiceReference.InfoConnSoapClient client = new InfoConnServiceReference.InfoConnSoapClient();
            ViewData["IsRefresh"] = client.RefreshUserCalendars(UserId, InfoConnServiceReference.CacheType.Short);
        }
        public ActionResult ggCalendar()
        {
            //InfoConnServiceReference.InfoConnSoapClient client = new InfoConnServiceReference.InfoConnSoapClient();
            //var connectorSource = client.GetConnectorSource(UserId, InfoConnServiceReference.ConnectorSourceType.Google);

            //if (connectorSource == null)
            //{
            //    if (Request["code"] == null)
            //    {

            //        return new RedirectResult(oAuthGoogle.AuthorizationLinkGet(), true);
            //    }
            //}

            //InfoConnServiceReference.SearchOption option = new InfoConnServiceReference.SearchOption();
            //InfoConn.TestWebsite.InfoConnServiceReference.Calendar[] obj = client.GetCalendars(UserId, InfoConnServiceReference.ConnectorSourceType.Google);
            //option.CalendarId = obj[2].CalendarId;
            //var model = client.GetEvents(UserId, option, InfoConnServiceReference.ConnectorSourceType.Google);

            //ViewData["MyListItems"] = obj;

            //return View(model);
            InfoConnServiceReference.InfoConnSoapClient client = new InfoConnServiceReference.InfoConnSoapClient();
            var connectorSource = client.GetConnectorSource(UserId, InfoConnServiceReference.ConnectorSourceType.Google);

            if (connectorSource == null)
            {
                if (Request["code"] == null)
                {

                    return new RedirectResult(oAuthGoogle.AuthorizationLinkGet(), true);
                }
                else
                {
                    var conectorAuth = oAuthFacbook.AccessTokenGet(Request["code"]);
                    connectorSource = new InfoConnServiceReference.ConnectorSource
                    {
                        UserId = UserId,
                        AccessToken = conectorAuth.AccessToken,
                        RefressToken = conectorAuth.RefressToken,
                        ExpiresDate = conectorAuth.ExpiresDate,
                        ConnectorSourceType = (int)ConnectorSourceType.Facebook,
                        LastModified = DateTime.Now,
                        IsUpdateRunning = false,
                        CacheLastUpdate_Short = DateTime.Now,
                        CacheLastUpdate_Longer = DateTime.Now,
                        CacheLastUpdate_Medium = DateTime.Now,
                        DoCacheUpdate_Longer = false,
                        DoCacheUpdate_Medium = false,
                        DoCacheUpdate_Short = false
                    };

                    client.AddConnectorSource(connectorSource);
                }
            }

            InfoConnServiceReference.SearchOption option = new InfoConnServiceReference.SearchOption();
            option.ConnectorSourceType = InfoConnServiceReference.ConnectorSourceType.Google;
            var model = client.GetEvents(UserId, option, InfoConnServiceReference.ConnectorSourceType.Google);
            ViewData["MyListItems"] = client.GetCalendars(UserId, InfoConnServiceReference.ConnectorSourceType.Google);
            return View(model);
        }

        public ActionResult GetCalendarEvents(string calendarId)
        {
            InfoConnServiceReference.InfoConnSoapClient client = new InfoConnServiceReference.InfoConnSoapClient();
            InfoConnServiceReference.SearchOption option = new InfoConnServiceReference.SearchOption();

            option.CalendarId = calendarId;
            InfoConn.TestWebsite.InfoConnServiceReference.Calendar[] obj = client.GetCalendars(UserId, InfoConnServiceReference.ConnectorSourceType.Google);
            var model = client.GetEvents(UserId, option, InfoConnServiceReference.ConnectorSourceType.Google);

            return PartialView("GetCalendarEvents", model);
        }

        public ActionResult iCalendar()
        {
            //return View(new InfoConn.TestWebsite.InfoConnServiceReference.Event[0]);

            //InfoConn.TestWebsite.InfoConnServiceReference.Event[] lst;

            InfoConnServiceReference.InfoConnSoapClient client = new InfoConnServiceReference.InfoConnSoapClient();
            var connectorSource = client.GetConnectorSource(UserId, InfoConnServiceReference.ConnectorSourceType.iCalendar);

            if (connectorSource == null)
            {
                // return empty
                return View(new InfoConn.TestWebsite.InfoConnServiceReference.Event[0]);

            }

            InfoConnServiceReference.SearchOption option = new InfoConnServiceReference.SearchOption();
            option.StartDate = DateTime.Today.AddMonths(-2);
            option.EndDate = DateTime.Today.AddMonths(2).AddSeconds(-1);

            //option.ICalendarPath = @"C:\\Test01.ics";

            var model = client.GetEvents(UserId, option, InfoConnServiceReference.ConnectorSourceType.iCalendar);

            return View(model);
        }

        [HttpPost]
        public ActionResult iCalendar(HttpPostedFileBase file)
        {

            InfoConnServiceReference.InfoConnSoapClient client = new InfoConnServiceReference.InfoConnSoapClient();
            var connectorSource = client.GetConnectorSource(UserId, InfoConnServiceReference.ConnectorSourceType.iCalendar);

            if (connectorSource == null)
            {         
                connectorSource = new InfoConnServiceReference.ConnectorSource
                {
                    UserId = UserId,                     
                    ConnectorSourceType = (int)ConnectorSourceType.iCalendar,                       
                    ExpiresDate = DateTime.Now,
                    LastModified = DateTime.Now,
                    IsUpdateRunning = false,
                    CacheLastUpdate_Short = DateTime.Now,
                    CacheLastUpdate_Longer = DateTime.Now,
                    CacheLastUpdate_Medium = DateTime.Now,
                    DoCacheUpdate_Longer = false,
                    DoCacheUpdate_Medium = false,
                    DoCacheUpdate_Short = false
                };

                client.AddConnectorSource(connectorSource);

            }

            var fileName = string.Format("ics_{0}_{1}", DateTime.Now.ToString("yyyyMMddHHmmssms"), Path.GetFileName(file.FileName));
            var path = Path.Combine(Server.MapPath("~/App_Data/Uploads"), fileName);
            file.SaveAs(path);


            List<Event> lst = new List<Event>();

            InfoConnServiceReference.SearchOption option = new InfoConnServiceReference.SearchOption();

            option.ICSFilePath = path;

            //Store event into cached database
            client.SaveEvents(UserId, option, InfoConnServiceReference.ConnectorSourceType.iCalendar);

            InfoConn.TestWebsite.InfoConnServiceReference.Event[] events = client.GetEvents(UserId, option, InfoConnServiceReference.ConnectorSourceType.iCalendar);
            if(events!=null && events.Length>0){
                return View(events);
            }else{
                return View();
            }
        }

        public ActionResult oauth2callback()
        {
            InfoConnServiceReference.InfoConnSoapClient client = new InfoConnServiceReference.InfoConnSoapClient();

            var conectorAuth = oAuthGoogle.AccessTokenGet(Request["code"]);
            var connectorSource = new InfoConnServiceReference.ConnectorSource
            {
                UserId = UserId,
                AccessToken = conectorAuth.AccessToken,
                RefressToken = conectorAuth.RefressToken,
                ExpiresDate = conectorAuth.ExpiresDate,
                ConnectorSourceType = (int)ConnectorSourceType.Google,
                LastModified = DateTime.Now,
                IsUpdateRunning = false,
                CacheLastUpdate_Short = DateTime.Now,
                CacheLastUpdate_Longer = DateTime.Now,
                CacheLastUpdate_Medium = DateTime.Now,
                DoCacheUpdate_Longer = false,
                DoCacheUpdate_Medium = false,
                DoCacheUpdate_Short = false


            };

            client.AddConnectorSource(connectorSource);
            return RedirectToAction(controller = "Home", action = "ggCalendar" );
            //return RedirectToAction("ggCalendar","Home");
        }

        [HttpPost]
        public ActionResult ggCalendar(string eventId, string fromDate, string toDate, string name, string location, string calendarid, string ept, string refresh)
        {
            InfoConnServiceReference.InfoConnSoapClient client = new InfoConnServiceReference.InfoConnSoapClient();
            InfoConnServiceReference.SearchOption option = new InfoConnServiceReference.SearchOption();
            option.EventId = eventId;
            option.Location = location;
            option.Name = name;
            option.CalendarId = Server.UrlDecode(calendarid);
            if (!string.IsNullOrEmpty(fromDate))
            {
                option.StartDate = Convert.ToDateTime(fromDate);
            }
            if (!string.IsNullOrEmpty(toDate))
            {
                option.EndDate = Convert.ToDateTime(toDate);
            }

            ViewData["MyListItems"] = client.GetCalendars(UserId, InfoConnServiceReference.ConnectorSourceType.Google);
            ViewData["selectedcalendarid"] = option.CalendarId;
            var model = new List<InfoConn.TestWebsite.InfoConnServiceReference.Event>();
            var events = client.GetEvents(UserId, option, InfoConnServiceReference.ConnectorSourceType.Google);

            if (events != null)
            {
                foreach (var evt in events)
                {
                    model.Add(evt);
                }
            }
            if (ept == "Export")
            {
                Export(events);
            }

            if (refresh == "Refresh")
            {
                Refresh();
            }
            return View(model);
        }

    }
}
