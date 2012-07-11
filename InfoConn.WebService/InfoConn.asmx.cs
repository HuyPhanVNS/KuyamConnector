using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Services;
using InfoConn.Core;
using InfoLib.GoogleConnector;
using InfoConn.Service;
using InfoConn.Data;
using InfoConn.Connector.Facebook;
using System.Web.Script.Services;
using Castle.Windsor;
using InfoConn.Data.Services;
using InfoConn.Services;
using InfoConn.Core.Domain.DTO;
using InfoConn.Core.Domain;
using InfoConn.Connector.ICalendar;

namespace InfoConn.WebService
{
    /// <summary>
    /// Summary description for InfoConn
    /// </summary>
    [WebService(Namespace = "http://kuyam.com/")]
    [WebServiceBinding(ConformsTo = WsiProfiles.BasicProfile1_1)]
    [System.ComponentModel.ToolboxItem(false)]
    [System.Web.Script.Services.ScriptService]
    public class InfoConn : System.Web.Services.WebService
    {

        #region Public methods
        [WebMethod]
        [ScriptMethod(ResponseFormat = System.Web.Script.Services.ResponseFormat.Json)]
        public bool ExportEvents(List<Event> events, string filepath)
        {
            ICalendarConnector iCal = new ICalendarConnector();
            return iCal.ExportCalendar(events, filepath);
        }
        #endregion
        [WebMethod]
        [ScriptMethod(ResponseFormat = System.Web.Script.Services.ResponseFormat.Json)]
        public bool SaveEvents(int userId, SearchOption searchInfo, ConnectorSourceType sourceType)
        {
            return IoC.Resolve<IConnectorService>().SaveEvents(userId, searchInfo, sourceType);
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = System.Web.Script.Services.ResponseFormat.Json)]
        public List<Event> GetEvents(int userId, SearchOption searchInfo, ConnectorSourceType sourceType)
        {
            //hot fix
            //searchInfo.UId = userId;
            return IoC.Resolve<IConnectorService>().GetEvents(userId, searchInfo, sourceType);
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = System.Web.Script.Services.ResponseFormat.Json)]
        public Event GetEvent(int userId, string eventId,string calendarId, ConnectorSourceType sourceType)
        {
            return IoC.Resolve<IConnectorService>().GetEvent(userId, eventId, calendarId,sourceType);
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = System.Web.Script.Services.ResponseFormat.Json)]
        public List<Event> GetRangeEvent(int userId, DateTime startDate, DateTime endDate, ConnectorSourceType sourceType)
        {
            return IoC.Resolve<IConnectorService>().GetEvent(userId, startDate, endDate, sourceType);
        }
        
        [WebMethod]
        [ScriptMethod(ResponseFormat = System.Web.Script.Services.ResponseFormat.Json)]

        public string PostEvent(int userId,ConnectorSourceType connectorSourceType, Event postEventPara)
        {
            return IoC.Resolve<IConnectorService>().PostEvent(userId, connectorSourceType, postEventPara);

        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = System.Web.Script.Services.ResponseFormat.Json)]
        public bool DeleteEvent(int userId, string eventId, string calendarId, ConnectorSourceType sourceType)
        {
            return IoC.Resolve<IConnectorService>().DeleteEvent(userId, eventId, calendarId, sourceType);
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = System.Web.Script.Services.ResponseFormat.Json)]
        public List<Calendar> GetCalendars(int userId, ConnectorSourceType sourceType)
        {
            return IoC.Resolve<IConnectorService>().GetCalendars(userId, sourceType);
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = System.Web.Script.Services.ResponseFormat.Json)]
        public Calendar GetCalendar(int userId, ConnectorSourceType sourceType,string calendarId)
        {
            return IoC.Resolve<IConnectorService>().GetCalendar(userId, sourceType,calendarId);
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = System.Web.Script.Services.ResponseFormat.Json)]
        public ServiceResponse<bool> AddConnectorSource(ConnectorSource connectorSource)
        {
            IoC.Resolve<IConnectorService>().AddConnectorSource(connectorSource);

            return new ServiceResponse<bool>()
            {
                Error = new ServiceResponse<bool>.ServiceError(),
                IsSuccess = true,
                Response = true
            };
        }

        [WebMethod]
        [ScriptMethod(ResponseFormat = System.Web.Script.Services.ResponseFormat.Json)]
        public ConnectorSource GetConnectorSource(int userId, ConnectorSourceType connectorSourceType)
        {
            return IoC.Resolve<IConnectorService>().GetConnectorSource(userId, connectorSourceType);
        }

        #region CACHING_CODE

        /// <summary>
        /// Fire off an update process of a user's cached calendar feeds.
        /// Calendar caches are either Short, Medium or Longer term caches.
        /// This function will cause an update of one of those caches.
        /// E.g. the Short term feed may only cache events from the next 48 hours, Medium for 7 days, etc
        /// </summary>
        /// <param name="userId"></param>
        /// <param name="cacheHorizon"></param>
        /// <returns></returns>
        [WebMethod]
        [ScriptMethod(ResponseFormat = System.Web.Script.Services.ResponseFormat.Json)]
        public bool RefreshUserCalendars(int userId, CacheType cacheHorizon)
        {
            IConnectorSourceService _service = IoC.Resolve<IConnectorSourceService>();

            foreach (var source in _service.GetConnectorSourcesByUserId(userId))
            {
                _service.UpdateConnectorSourceStatus(source.Id, true, cacheHorizon);
            }

            // TODO: what should return code be?
            return true;
        }

        /// <summary>
        /// Fire off an update process of a user's cached calendar feeds.
        /// Calendar caches are either Short, Medium or Longer term caches.
        /// This function will cause an update of ALL of those caches.
        /// </summary>
        /// <param name="userId"></param>
        /// <returns></returns>
        [WebMethod]
        [ScriptMethod(ResponseFormat = System.Web.Script.Services.ResponseFormat.Json)]
        public bool RefreshUserCalendarsAllCaches(int userId)
        {
            IConnectorSourceService _service = IoC.Resolve<IConnectorSourceService>();

            foreach (var source in _service.GetConnectorSourcesByUserId(userId))
            {
                _service.UpdateConnectorSourceStatus(source.Id, true, CacheType.Short);
                //_service.UpdateConnectorSourceStatus(source.Id, true, CacheType.Medium);
                //_service.UpdateConnectorSourceStatus(source.Id, true, CacheType.Longer);
            }

            // TODO: what should return code be?
            return true;
        }

        class CacheInfo
        {
            public int ConnectorSourceType;
            public DateTime LastUpdate_Short;
            public DateTime LastUpdate_Medium;
            public DateTime LastUpdate_Longer;
        }

        /// <summary>
        /// Return struct/list of last updated times for caches. May be displayed in Kuyam UI for users, certainly for testing.
        /// </summary>
        /// <param name="?"></param>
        /// <returns></returns>
        [WebMethod]
        [ScriptMethod(ResponseFormat = System.Web.Script.Services.ResponseFormat.Json)]
        List<CacheInfo> GetUserCalendarsCacheInfo(int userId)
        {
            List<CacheInfo> _list = new List<CacheInfo>();
            IConnectorSourceService _service = IoC.Resolve<IConnectorSourceService>();

            foreach (var source in _service.GetConnectorSourcesByUserId(userId))
            {
                CacheInfo _info = new CacheInfo();
                _info.ConnectorSourceType = source.ConnectorSourceType;
                _info.LastUpdate_Short = source.CacheLastUpdate_Short;
                _info.LastUpdate_Medium = source.CacheLastUpdate_Medium;
                _info.LastUpdate_Longer = source.CacheLastUpdate_Longer;
                _list.Add(_info);
            }

            return _list;
        }

        #endregion

        
        #region FREE_BUSY
        public class BusyInfo
        {
            public DateTime StartDate;
            public DateTime EndDate;
            public ConnectorSourceType SourceType;
        }

        /// <summary>
        /// Return list of times when user is busy as gathered from all his third party Cloud Calendars
        /// </summary>
        /// <param name="?"></param>
        /// <returns></returns>
        [WebMethod]
        [ScriptMethod(ResponseFormat = System.Web.Script.Services.ResponseFormat.Json)]
        public List<BusyInfo> GetBusyInfo(int userId)
        {
            List<BusyInfo> _list = new List<BusyInfo>();
            IConnectorSourceService _service = IoC.Resolve<IConnectorSourceService>();

            foreach (var source in _service.GetConnectorSourcesByUserId(userId))
            {
                foreach (var ev in source.Events)
                {
                    BusyInfo _info = new BusyInfo();
                    _info.StartDate = ev.StartDate;
                    _info.EndDate = ev.EndDate;
                    // TODO: don't like this cast, why do we need?
                    _info.SourceType = (ConnectorSourceType) source.ConnectorSourceType;

                    _list.Add(_info);
                }
            }

            return _list;
        }
        #endregion

        #region EXTERNAL_FEED

        /*
         * Quick and dirty version of Kuyam calendar as feed:
         * - they pass in a list of events
         * - we return string for an ICS file suitable for use as an ICS feed (e.g. webcal://url-to-ICS-file)
         * 
         * It could be that we're required to 'host' and cache the feed but not in this version.
         * If needed, then will need to push events to us, update those events, notify us of changes to events.
         * We then update our version of the feed and cache it.
         * 
         * That's more cumbersome than having Kuyam ask us for new ICS version whenever user makes a change 
         * to their Kuyam calendar.
        */

        /// <summary>
        /// Create an ICS version of the Kuyam calendar events passed in.
        /// </summary>
        /// <param name="events">List of user's Kuyam events. Note: currently using our event format.</param>
        /// <returns></returns>
        [WebMethod]
        [ScriptMethod(ResponseFormat = System.Web.Script.Services.ResponseFormat.Json)]
        public string GetExternalFeed(List<Event> events)
        {
            // TODO: not sure what Timezone Kuyam will be using, make sure we adjust.
            // TODO: to be smart, should refactor ICalendarConnector::ExportCalendar() to return string and then reuse here.
            
            // Get serializable calendar from the input events
            DDay.iCal.IICalendar theCal = CreateCalendar(events);

            // Serialize the calendar to a string
            DDay.iCal.Serialization.iCalendar.iCalendarSerializer serializer =
                new DDay.iCal.Serialization.iCalendar.iCalendarSerializer();
            string retVal = serializer.SerializeToString(theCal);
            //serializer.Serialize(theCal, filepath);

            return retVal;
        }

        /// <summary>
        /// Internal function to create a new calendar in DDay format.
        /// </summary>
        /// <param name="events">List of events from user's Kuyam calendar</param>
        /// <returns></returns>
        private DDay.iCal.IICalendar CreateCalendar(List<Event> events)
        {
            // TODO: not sure what Timezone Kuyam will be using, make sure we adjust.
            // TODO: to be smart, should refactor ICalendarConnector::ExportCalendar() to return string and then reuse here.

            DDay.iCal.IICalendar theCal = new DDay.iCal.iCalendar();

            foreach (var theEvent in events)
            {
                // Create another event
                // See full example below of all the things we could set on the DDay event if Kuyam sends it.
                DDay.iCal.Event evt = theCal.Create<DDay.iCal.Event>();

                evt.Summary = theEvent.Summary;
                evt.Description = theEvent.Description;
                evt.Start = new DDay.iCal.iCalDateTime(theEvent.StartDate);
                evt.End = new DDay.iCal.iCalDateTime(theEvent.EndDate);
                evt.Location = theEvent.Location;
                evt.UID = theEvent.UId;
            }

            return theCal;
        }

        /// <summary>
        /// Sample code copied from this URL and modified:
        /// https://github.com/mdavid/DDay.iCal/blob/master/Examples/C%23/Example6/Program.cs
        /// Creates a calendar with 2 events, and returns it.
        /// Get the Americal.ics timezone file here
        /// https://github.com/mdavid/DDay.iCal/blob/master/Examples/C%23/Example6/
        /// </summary>
        private DDay.iCal.IICalendar SampleCreateCalendar(List<Event> events)
        {
            // First load a file containing time zone information for North & South America
            DDay.iCal.IICalendar timeZones = DDay.iCal.iCalendar.LoadFromFile("America.ics")[0];

            // Add the time zones we are going to use to our calendar
            // If we're not sure what we'll use, we could simply copy the
            // entire time zone information instead:
            //
            // IICalendar iCal = timeZones.Copy<IICalendar>();
            //
            // This will take significantly more disk space, and can slow
            // down performance, so I recommend you determine which time
            // zones will be used and only copy the necessary zones.
            DDay.iCal.IICalendar theCal = new DDay.iCal.iCalendar();
            theCal.AddChild(timeZones.GetTimeZone("America/New_York"));
            theCal.AddChild(timeZones.GetTimeZone("America/Denver"));            

            // Create an event and attach it to the iCalendar.
            DDay.iCal.Event evt = theCal.Create<DDay.iCal.Event>();

            // Set the one-line summary of the event
            evt.Summary = "The first Monday and second-to-last Monday of each month";

            // Set the longer description of the event
            evt.Description = "A more in-depth description of this event.";

            // Set the event to start at 11:00 A.M. New York time on January 2, 2007.
            evt.Start = new DDay.iCal.iCalDateTime(2007, 1, 2, 11, 0, 0, "America/New_York", theCal);

            // Set the duration of the event to 1 hour.
            // NOTE: this will automatically set the End time of the event
            evt.Duration = TimeSpan.FromHours(1);

            // The event has been confirmed
            evt.Status = DDay.iCal.EventStatus.Confirmed;

            // Set the geographic location (latitude,longitude) of the event
            evt.GeographicLocation = new DDay.iCal.GeographicLocation(114.2938, 32.982);

            evt.Location = "Home office";
            evt.Priority = 7;

            // Add an organizer to the event.
            // This is the person who created the event (or who is in charge of it)            
            evt.Organizer = new DDay.iCal.Organizer("MAILTO:danielg@daywesthealthcare.com");
            // Indicate that this organizer is a member of another group
            evt.Organizer.Parameters.Add("MEMBER", "MAILTO:DEV-GROUP@host2.com");

            // Add a person who will attend the event
            // FIXME: re-implement this
            //evt.Attendees.Add(new Attendee("doug@ddaysoftware.com"));

            // Add categories to the event
            evt.Categories.Add("Work");
            evt.Categories.Add("Personal");

            // Add some comments to the event
            evt.Comments.Add("Comment #1");
            evt.Comments.Add("Comment #2");

            // Add resources that will be used for the event
            evt.Resources.Add("Conference Room #2");
            evt.Resources.Add("Projector #4");

            // Add contact information to this event, with an optional link to further information
            // FIXME: reimplement this:
            //evt.Contacts.Add("Doug Day (XXX) XXX-XXXX", new Uri("http://www.someuri.com/pdi/dougd.vcf"));

            // Set the identifier for the event.  NOTE: this will happen automatically
            // if you don't do it manually.  We set it manually here so we can easily
            // refer to this event later.
            evt.UID = "1234567890";

            // Now, let's add a recurrence pattern to this event.
            // It needs to happen on the first Monday and
            // second to last Monday of each month.
            DDay.iCal.RecurrencePattern rp = new DDay.iCal.RecurrencePattern();
            rp.Frequency = DDay.iCal.FrequencyType.Monthly;
            rp.ByDay.Add(new DDay.iCal.WeekDay(DayOfWeek.Monday, DDay.iCal.FrequencyOccurrence.First));
            rp.ByDay.Add(new DDay.iCal.WeekDay(DayOfWeek.Monday, DDay.iCal.FrequencyOccurrence.SecondToLast));
            evt.RecurrenceRules.Add(rp);

            // Let's also add an alarm on this event so we can be reminded of it later.
            DDay.iCal.Alarm alarm = new DDay.iCal.Alarm();

            // Display the alarm somewhere on the screen.
            alarm.Action = DDay.iCal.AlarmAction.Display;

            // This is the text that will be displayed for the alarm.
            alarm.Summary = "Alarm for the first Monday and second-to-last Monday of each month";

            // The alarm is set to occur 30 minutes before the event
            alarm.Trigger = new DDay.iCal.Trigger(TimeSpan.FromMinutes(-30));

            // Set the alarm to repeat twice (for a total of 3 alarms)
            // before the event.  Each repetition will occur 10 minutes
            // after the initial alarm.  In english - that means
            // the alarm will go off 30 minutes before the event,
            // then again 20 minutes before the event, and again
            // 10 minutes before the event.
            alarm.Repeat = 2;
            alarm.Duration = TimeSpan.FromMinutes(10);

            // Add the alarm to the event
            evt.Alarms.Add(alarm);

            // Create another (much more simple) event
            evt = theCal.Create<DDay.iCal.Event>();
            evt.Summary = "Every month on the 21st";
            evt.Description = "A more in-depth description of this event.";
            evt.Start = new DDay.iCal.iCalDateTime(2007, 1, 21, 16, 0, 0, "America/New_York", theCal);
            evt.Duration = TimeSpan.FromHours(1.5);

            rp = new DDay.iCal.RecurrencePattern();
            rp.Frequency = DDay.iCal.FrequencyType.Monthly;
            evt.RecurrenceRules.Add(rp);

            return theCal;
        }
        #endregion
    }
}
