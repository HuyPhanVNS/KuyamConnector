using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using InfoConn.Core;
using Google.Apis.Calendar.v3;
using Google.Apis.Authentication.OAuth2.DotNetOpenAuth;
using Google.Apis.Authentication.OAuth2;
using DotNetOpenAuth.OAuth2;
using InfoConn.Config;
using Google.Apis.Util;
using InfoConn.Core.Exceptions;
using InfoConn.Core.Domain;
using System.Collections.Specialized;
using System.Web;
using InfoConn.Core.Domain.DTO;
using InfoConn.Data.Services;

namespace InfoLib.GoogleConnector
{
    public class GoogleConnector : ConnectorBase
    {
        /// <summary>
        /// GoogleClient variables
        /// </summary>
        #region  variables
        const string GoogleClientIdentifierSettingKey = "InfoConn.Connector.Google.ClientIdentifier";
        const string GoogleClientSecretSettingKey = "InfoConn.Connector.Google.ClientSecret";
        readonly ISettingService _settingService;
        readonly Google.Apis.Calendar.v3.CalendarService _calendarService;
        readonly IEventService _eventService;
        readonly ICalendarService _calendarDBService;
        readonly IConnectorSourceService _connectorService;

        IAuthorizationState _state;
        #endregion

        /// <summary>
        /// Contructor
        /// </summary>
        /// <param name="settingService"></param>
        #region Contructor

        public GoogleConnector(ISettingService settingService, IEventService eventService, ICalendarService calendarDBService, IConnectorSourceService connectorsService)
        {
            this._settingService = settingService;
            this._eventService = eventService;
            this._calendarDBService = calendarDBService;
            this._connectorService = connectorsService;

            var provider = new NativeApplicationClient(GoogleAuthenticationServer.Description);
            provider.ClientIdentifier = _settingService.GetSetting(GoogleClientIdentifierSettingKey);
            provider.ClientSecret = _settingService.GetSetting(GoogleClientSecretSettingKey);
            var auth = new OAuth2Authenticator<NativeApplicationClient>(provider, GetAuthorization);

            _calendarService = new Google.Apis.Calendar.v3.CalendarService(auth);
            _state = new AuthorizationState(new string[] {
                Google.Apis.Calendar.v3.CalendarService.Scopes.Calendar.GetStringValue(),
                Google.Apis.Calendar.v3.CalendarService.Scopes.CalendarReadonly.GetStringValue()
            });
        }
        #endregion

        /// <summary>
        /// Method overrided
        /// </summary>        
        #region Method overrided
        public override void Init(ConnectorSource source)
        {
            base.Init(source);

            _state.AccessToken = this.Source.AccessToken;
            _state.RefreshToken = this.Source.RefressToken;
        }
        /// <summary>
        /// Get authorization
        /// </summary>
        /// <param name="client"></param>
        /// <returns></returns>
        private IAuthorizationState GetAuthorization(NativeApplicationClient client)
        {
            if (_state != null)
            {
                try
                {
                    client.RefreshToken(_state);
                    return _state; // Yes - we are done.
                }
                catch (DotNetOpenAuth.Messaging.ProtocolException ex)
                {
                    //CommandLine.WriteError("Using existing refresh token failed: " + ex.Message);
                }
            }

            return _state;
        }
        public override List<Event> GetEvents(SearchOption searchInfo)
        {
            searchInfo.ConnectorSourceType = ConnectorSourceType.Google;
            return _eventService.GetEvents(searchInfo);           
        }

        /// <summary>
        /// Get event by eventId, calendaId
        /// </summary>
        /// <param name="userId"></param>
        /// <param name="eventId"></param>
        /// <param name="calendarId"></param>
        /// <returns></returns>
        public override Event GetEvent(int userId, string eventId, string calendarId)
        {
            if (!IsSourceSet)
            {
                throw new SourceNotSetException();
            }
            Google.Apis.Calendar.v3.Data.Event eventRequest = _calendarService.Events.Get(calendarId, eventId).Fetch();
            return new Event
            {
                EventId = eventRequest.Id,
                Summary = eventRequest.Summary,
                Description = eventRequest.Description,
                Location = eventRequest.Location,
                StartDate = Convert.ToDateTime(eventRequest.Start.DateTime),
                EndDate = Convert.ToDateTime(eventRequest.End.DateTime)
            };
        }

        /// <summary>
        /// Get calendar by calendarid
        /// </summary>
        /// <param name="calendarId"></param>
        /// <returns></returns>
        public override Calendar GetCalendar(string calendarId)
        {
            if (!IsSourceSet)
            {
                throw new SourceNotSetException();
            }

            Google.Apis.Calendar.v3.Data.Calendar calendarRequest = _calendarService.Calendars.Get(calendarId).Fetch();
            return new Calendar
            {
                CalendarId = calendarRequest.Id,
                ConnectorSourceId = Source.Id,
                Summary = calendarRequest.Summary,
                Description = calendarRequest.Description
            };
        }


        /// <summary>
        /// Get list of calendar
        /// </summary>
        /// <returns></returns>
        public override List<Calendar> GetCalendars()
        {
            //if (IsOutOfDate(null, null))
            //    UpdateCache();

            return _calendarDBService.GetCalendars(Source);
        }

        /// <summary>
        /// Insert event to Calendar
        /// </summary>
        /// <param name="userId"></param>
        /// <param name="connectorSourceType"></param>
        /// <param name="postOption"></param>
        /// <returns></returns>
        public override string PostEvent(int userId, ConnectorSourceType connectorSourceType, Event postEventPara)
        {
            Google.Apis.Calendar.v3.Data.Event newEvent = new Google.Apis.Calendar.v3.Data.Event()
            {
                Summary = postEventPara.Summary,
                Location = postEventPara.Location,
                Description = postEventPara.Description,
                Start = new Google.Apis.Calendar.v3.Data.EventDateTime() { DateTime = postEventPara.StartDate.ToString() },
                End = new Google.Apis.Calendar.v3.Data.EventDateTime() { DateTime = postEventPara.EndDate.ToString() },
            };
            var calendarID = _calendarService.CalendarList.List().Fetch().Items.Where(x => x.AccessRole == "owner").Select(x => x.Id).FirstOrDefault();
            EventsResource.InsertRequest eventResouce = _calendarService.Events.Insert(newEvent, calendarID);
            return eventResouce.CalendarId;

        }
        /// <summary>
        /// Delete event
        /// </summary>
        /// <param name="userId"></param>
        /// <param name="eventId"></param>
        /// <param name="calendarId"></param>
        /// <returns></returns>
        public override bool DeleteEvent(int userId, string eventId, string calendarId)
        {
            var deleteEvent = _calendarService.Events.Delete(calendarId, eventId).Fetch();
            if (deleteEvent == "")
                return true;
            return false;

        }

        #endregion

        /// <summary>
        /// Get Calendar, event from google, update to db
        /// </summary>
        public override void UpdateCache(int connectSourceId, CacheType cachType)
        {

            if (!IsSourceSet)
            {
                throw new SourceNotSetException();
            }
            _eventService.UpdateConnectorSource(connectSourceId, cachType);
            Source = _connectorService.GetConnectorSourcesById(connectSourceId);
            

            var calendars = _calendarService.CalendarList.List().Fetch().Items.Select(gc => new Calendar
            {
                CalendarId = gc.Id,
                ConnectorSourceId = connectSourceId,
                Summary = gc.Summary,
                Description = gc.Description
            }).ToList();

            _calendarDBService.SaveCalendars(calendars);

            var calendarDB = _calendarDBService.GetCalendars(Source);

            List<Event> result = new List<Event>();
            foreach (var item in calendarDB)
            {

                try
                {
                    var itemCal = _calendarService.Events.List(item.CalendarId).Fetch();

                    if (item == null) { continue; }
                    var listEvent = itemCal.Items;
                    if (listEvent != null)
                    {
                       result.AddRange(listEvent.Select(gc => new Event
                            {
                                EventId = gc.Id,
                                ConnectorSourceId = connectSourceId,
                                CalendarId = item.Id,
                                Summary = gc.Summary,
                                Description = gc.Description,
                                Location = gc.Location,
                                StartDate = Convert.ToDateTime(gc.Start.DateTime ?? gc.Start.Date),
                                EndDate = Convert.ToDateTime(gc.End.DateTime ?? gc.End.Date),
                            }));
                    }
                }
                catch (Exception ex)
                {
                    continue;
                }
            }

            
            _eventService.SaveEvents(result, connectSourceId, (int)ConnectorSourceType.Google);

        }

        /// <summary>
        /// Get Calendar, event from google, update to db
        /// </summary>
        /*
        public void UpdateCache()
        {
            if (!IsSourceSet)
            {
                throw new SourceNotSetException();
            }

            var calendars = _calendarService.CalendarList.List().Fetch().Items.Select(gc => new Calendar
            {
                CalendarId = gc.Id,
                ConnectorSourceId = Source.Id,
                Summary = gc.Summary,
                Description = gc.Description
            }).ToList();

            _calendarDBService.SaveCalendars(calendars);

            var calendarDB = _calendarDBService.GetCalendars(Source);

            List<Event> result = new List<Event>();
            foreach (var item in calendarDB)
            {

                try
                {
                    var itemCal = _calendarService.Events.List(item.CalendarId).Fetch();

                    if (item == null) { continue; }
                    var listEvent = itemCal.Items;
                    if (listEvent != null)
                    {
                        result.AddRange(listEvent.Select(gc => new Event
                        {
                            EventId = gc.Id,
                            ConnectorSourceId = Source.Id,
                            CalendarId = item.Id,
                            Summary = gc.Summary,
                            Description = gc.Description,
                            Location = gc.Location,
                            StartDate = Convert.ToDateTime(gc.Start.DateTime ?? gc.Start.Date),
                            EndDate = Convert.ToDateTime(gc.End.DateTime ?? gc.End.Date),
                        }));
                    }
                }
                catch (Exception ex)
                {
                    continue;
                }
            }
           
            _eventService.SaveEvents(result, Source.Id, (int)ConnectorSourceType.Google);

        }
         * */
    }
}
