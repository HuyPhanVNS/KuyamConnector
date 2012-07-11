using System;
using System.Collections.Generic;
using System.Web.Script.Serialization;
using Facebook;
using InfoConn.Config;
using InfoConn.Core;
using InfoConn.Core.Common;
using InfoConn.Core.Domain;
using InfoConn.Core.Domain.DTO;
using InfoConn.Core.Exceptions;
using Newtonsoft.Json;
using InfoConn.Data.Services;


namespace InfoConn.Connector.Facebook
{
    public class FacebookConnector : ConnectorBase
    {
        readonly IEventService _eventService;

        /// <summary>
        /// Authentication variables  
        /// </summary>        
        #region Authentication variables
        const string FacebookAppIdSettingKey = "InfoConn.Connector.Facebook.ClientIdentifier";
        const string FacebookAppSecretSettingKey = "InfoConn.Connector.Facebook.ClientSecret";
        readonly ISettingService _settingService;
        readonly IConnectorSourceService _connectorService;
        FacebookClient _facebookClient;
        #endregion

        /// <summary>
        /// Contructor
        /// </summary>
        /// <param name="settingService"></param>
        #region Contructor

        public FacebookConnector(ISettingService settingService, IEventService eventService, IConnectorSourceService connectorService)
        {
            this._settingService = settingService;
            this._eventService = eventService;
            this._connectorService = connectorService;
            _facebookClient = new FacebookClient();
            _facebookClient.AppId = _settingService.GetSetting(FacebookAppIdSettingKey);
            _facebookClient.AppSecret = _settingService.GetSetting(FacebookAppSecretSettingKey);
        }

        #endregion

        /// <summary>
        /// Method Overrided
        /// </summary>        
        #region Method Overrided
        /// <summary>
        /// Get All Events with object filter
        /// </summary>
        /// <param name="searchInfo"></param>
        /// <returns></returns>
        public override List<Event> GetEvents(SearchOption searchInfo)
        {
            //if (IsOutOfDate(searchInfo.StartDate, searchInfo.EndDate))
            //    UpdateCache();
            searchInfo.ConnectorSource = ConnectorSourceType.Facebook;
            return _eventService.GetEvents(searchInfo);
           
        }
        /// <summary>
        /// Get event
        /// </summary>
        /// <param name="userId"></param>
        /// <param name="eventId"></param>
        /// <returns></returns>
        public override Event GetEvent(int userId, string eventId, string calendarId)
        {
            if (!IsSourceSet)
            {
                throw new SourceNotSetException();
            }
            var result = new Event();
            _facebookClient.AccessToken = Source.AccessToken;
            dynamic events = _facebookClient.Get(eventId);
            JavaScriptSerializer javascriptSerialize = new JavaScriptSerializer();
            javascriptSerialize.RegisterConverters(new JavaScriptConverter[] { new DynamicJsonConverter() });
            dynamic eventEntry = javascriptSerialize.Deserialize(events.ToString(), typeof(object)) as dynamic;
            result.EventId = eventEntry.id;
            result.Summary = eventEntry.name;
            result.StartDate = TimeZoneInfo.ConvertTimeToUtc(Convert.ToDateTime(eventEntry.start_time));
            result.EndDate = TimeZoneInfo.ConvertTimeToUtc(Convert.ToDateTime(eventEntry.end_time));
            result.Location = eventEntry.location;
            return result;

        }

        public override List<Calendar> GetCalendars()
        {
            return new List<Calendar> { new Calendar { CalendarId = "Default", Summary = "Default" } };
        }

        public override Calendar GetCalendar(string calendarId)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        ///  Add a event to my facebook account:
        /// </summary>
        /// <param name="postOption"></param>
        /// <returns>The new post ID</returns>

        public override string PostEvent(int userId, ConnectorSourceType connectorSourceType, Event postEventPara)
        {
            if (!IsSourceSet)
            {
                throw new SourceNotSetException();
            }

            _facebookClient.AccessToken = Source.AccessToken;
            Dictionary<string, object> createEventParameters = new Dictionary<string, object>();
            createEventParameters.Add("name", postEventPara.Summary);
            createEventParameters.Add("start_time", postEventPara.StartDate.ToUniversalTime().ToString());
            createEventParameters.Add("end_time", postEventPara.EndDate.ToUniversalTime().ToUniversalTime().ToString());
            createEventParameters.Add("uid", postEventPara.UId);
            createEventParameters.Add("description", postEventPara.Description);
            JsonObject result = _facebookClient.Post("me/events", createEventParameters) as JsonObject;
            return result["id"].ToString();
        }

        /// <summary>
        /// Delete Event
        /// </summary>
        /// <param name="userId"></param>
        /// <param name="eventId"></param>
        /// <returns></returns>
        public override bool DeleteEvent(int userId, string eventId, string calendarId)
        {
            Dictionary<string, object> deleteEventParameters = new Dictionary<string, object>();
            deleteEventParameters.Add("id", eventId);
            if (!IsSourceSet)
            {
                throw new SourceNotSetException();
            }
            _facebookClient.AccessToken = Source.AccessToken;
            dynamic result = _facebookClient.Delete("/", deleteEventParameters);
            return result;
        }
        #endregion

        ///// <summary>
        ///// Get event from FB, update to db
        ///// </summary>
        //public override void UpdateCache()
        //{
        //    if (!IsSourceSet)
        //    {
        //        throw new SourceNotSetException();
        //    }           
        //    var result = new List<Event>();
        //    _facebookClient.AccessToken = Source.AccessToken;
        //    dynamic events = _facebookClient.Get("me/events");
        //    FBEventList fbEvenList = (FBEventList)JsonConvert.DeserializeObject(events.ToString(), typeof(FBEventList));

        //    if (fbEvenList != null && fbEvenList.Data != null)
        //    {
        //        foreach (FBEvent fbEvent in fbEvenList.Data)
        //        {
        //            result.Add(new Event
        //            {
        //                EventId = fbEvent.ID,
        //                ConnectorSourceId = Source.Id,
        //                Summary = fbEvent.Name,
        //                Location = fbEvent.Location,
        //                StartDate = fbEvent.StartTime,
        //                EndDate = fbEvent.StartTime.Date .AddHours(23).AddMinutes(59).AddSeconds(59)
        //            });
        //        }
        //    }

        //    _eventService.SaveEvents(result, (int)ConnectorSourceType.Facebook);
        //}

        /// <summary>
        /// Get event from FB, update to db
        /// </summary>
        public override void UpdateCache(int connectSourceId, CacheType cachType)
        {
            if (!IsSourceSet)
            {
                throw new SourceNotSetException();
            }
            _eventService.UpdateConnectorSource(connectSourceId, cachType);
            Source = _connectorService.GetConnectorSourcesById(connectSourceId);
            DateTime value = DateTime.Now.AddDays(-40);
            TimeSpan span = (value - new DateTime(1970, 1, 1, 0, 0, 0, 0).ToLocalTime());
            double seconds = (double)span.TotalSeconds;
            var result = new List<Event>();
            _facebookClient.AccessToken = Source.AccessToken;
            dynamic events = _facebookClient.Get("me/events");
            FBEventList fbEvenList = (FBEventList)JsonConvert.DeserializeObject(events.ToString(), typeof(FBEventList));

            if (fbEvenList != null && fbEvenList.Data != null)
            {
                foreach (FBEvent fbEvent in fbEvenList.Data)
                {
                    result.Add(new Event
                    {
                        EventId = fbEvent.ID,
                        ConnectorSourceId = Source.Id,
                        Summary = fbEvent.Name,
                        Location = fbEvent.Location,
                        StartDate = fbEvent.StartTime,
                        EndDate = fbEvent.EndTime > fbEvent.StartTime ? fbEvent.EndTime : fbEvent.StartTime.Date .AddHours(23).AddMinutes(59).AddSeconds(59)
                    });
                }
            }            
            _eventService.SaveEvents(result, connectSourceId, (int)ConnectorSourceType.Facebook);
        }
    }
}
