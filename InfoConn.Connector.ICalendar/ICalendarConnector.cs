using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using InfoConn.Core;
using InfoConn.Core.Exceptions;
using InfoConn.Core.Domain.DTO;
using InfoConn.Core.Domain;
using InfoConn.Data.Services;

namespace InfoConn.Connector.ICalendar
{
    public class ICalendarConnector : ConnectorBase
    {
        readonly IEventService _eventService;

        #region Contructor
        /// <summary>
        /// Contructor
        /// </summary>
        public ICalendarConnector(IEventService eventService)
        {
            this._eventService = eventService;
        }

        public ICalendarConnector()
        {
            // TODO: Complete member initialization
        }
        #endregion

        #region Method Overrided
        public override bool SaveEvents(SearchOption searchInfo)
        {
            bool result = false;
            DDay.iCal.IICalendar iCal = DDay.iCal.iCalendar.LoadFromFile(searchInfo.ICSFilePath)[0];

            //iCal.Events
            foreach (DDay.iCal.IEvent item in iCal.Events)
            {
                try
                {
                    InfoConn.Core.Domain.Event evt = new InfoConn.Core.Domain.Event()
                    {
                        EventId = item.UID,
                        UId = item.UID,
                        StartDate = item.Start.Date,
                        EndDate = item.End.Date,
                        Summary = item.Summary,
                        Location = item.Location,
                        Description = item.Description,
                        ConnectorSourceId = this.Source.Id
                    };
                    _eventService.SaveEvent(evt);
                }
                catch (Exception ex)
                {
                    // Logger
                }
            }

            result = true;

            // delete temp ics file
            try { System.IO.File.Delete(searchInfo.ICSFilePath); }
            catch (Exception ex) {/*Log*/}

            return result;
        }



        public override List<InfoConn.Core.Domain.Event> GetEvents(SearchOption searchInfo)
        {
            if (!IsSourceSet)
            {
                throw new SourceNotSetException();
            }
            searchInfo.ConnectorSourceType = ConnectorSourceType.iCalendar;
            List<InfoConn.Core.Domain.Event> result = _eventService.GetEvents(searchInfo);

            return result;
        }
        public override InfoConn.Core.Domain.Event GetEvent(int userId, string eventId, string calendarId)
        {
            throw new NotImplementedException();
        }
        public override List<Calendar> GetCalendars()
        {
            throw new NotImplementedException();
        }
        public override Calendar GetCalendar(string calendarId)
        {
            throw new NotImplementedException();
        }

        public override bool DeleteEvent(int userId, string eventId, string calendarId)
        {
            throw new NotImplementedException();
        }

        public override string PostEvent(int userId, ConnectorSourceType connectorSourceType, Event postEventPara)
        {
            throw new NotImplementedException();
        }
        #endregion

        #region Method
        /// <summary>
        /// Export iCalendar
        /// </summary>
        /// <param name="eventList"></param>
        /// <param name="filePath"></param>
        public bool ExportCalendar(List<Event> eventList, string filePath)
        {
            try
            {
                // Create an iCalendar.
                DDay.iCal.IICalendar iCal = new DDay.iCal.iCalendar();

                foreach (Event eventItem in eventList)
                {
                    // Create an event and attach it to the iCalendar.
                    DDay.iCal.Event evt = iCal.Create<DDay.iCal.Event>();

                    evt.Summary = eventItem.Summary;
                    evt.Description = eventItem.Description;
                    evt.Start = new DDay.iCal.iCalDateTime(eventItem.StartDate);
                    evt.End = new DDay.iCal.iCalDateTime(eventItem.EndDate);
                    evt.Location = eventItem.Location;
                    evt.UID = eventItem.UId;
                }
                //Save iCalendar with file path.
                DDay.iCal.Serialization.iCalendar.iCalendarSerializer serializer = new DDay.iCal.Serialization.iCalendar.iCalendarSerializer();
                serializer.Serialize(iCal, filePath);

                return true;
            }
            catch (Exception ex)
            {
                // Logg
                return false;
            }
        }
        #endregion

        public void UpdateCache()
        {

        }

        public override void UpdateCache(int connectSourceID, CacheType cacheType)
        {

        }
    }
}
