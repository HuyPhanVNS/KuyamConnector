using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using InfoConn.Data;
using InfoConn.Core;
using InfoConn.Data.Respositories;

namespace InfoConn.Data.Services
{
    public class EventService : IEventService
    {
        public IEventRepository _eventRepository { get; set; }
        public ICalendarRepository _calendarRepository { get; set; }
        public IConnectorSourceRepository _connectorSourceRepository { get; set; }

        public EventService(IEventRepository eventRepository, ICalendarRepository calendarRepository, IConnectorSourceRepository connectorSourceRepository)
        {
            this._eventRepository = eventRepository;
            this._calendarRepository = calendarRepository;
            this._connectorSourceRepository = connectorSourceRepository;
        }

        /// <summary>
        /// Insert Event into database
        /// </summary>
        /// <param name="event"></param>
        public void SaveEvent(Core.Domain.Event @event)
        {
            var dbEvent = _eventRepository.Table.FirstOrDefault(e => e.EventId == @event.EventId);
            if (dbEvent == null)
            {
                _eventRepository.Insert(@event);
            }
            else
            {
                dbEvent.Description = @event.Description;
                dbEvent.EndDate = @event.EndDate;
                dbEvent.EventId = @event.EventId;
                dbEvent.Location = @event.Location;
                dbEvent.StartDate = @event.StartDate;
                dbEvent.Summary = @event.Summary;
                dbEvent.UId = @event.UId;
                dbEvent.ConnectorSourceId = @event.ConnectorSourceId;
                dbEvent.CalendarId = @event.CalendarId;

                _eventRepository.Update(dbEvent);
            }
        }

        /// <summary>
        /// Get events with condition
        /// </summary>
        /// <param name="searchInfo"></param>
        /// <returns></returns>
        public List<Core.Domain.Event> GetEvents(Core.Domain.DTO.SearchOption searchInfo)
        {
            int? calendarId = null;
            if (!string.IsNullOrEmpty(searchInfo.CalendarId))
            {
                var calendar = _calendarRepository.Table.FirstOrDefault(c => c.CalendarId == searchInfo.CalendarId);
                if (calendar != null)
                    calendarId = calendar.Id;
            }

            if (searchInfo.StartDate == null)
                searchInfo.StartDate = System.Data.SqlTypes.SqlDateTime.MinValue.Value;
            if (searchInfo.EndDate == null)
                searchInfo.EndDate = DateTime.MaxValue;

            int ConnectorSourceId = _connectorSourceRepository.Table.ToList().Where(x => x.ConnectorSourceType == (int)searchInfo.ConnectorSourceType
                && x.UserId == searchInfo.UId
                ).FirstOrDefault().Id;
            var result = _eventRepository.Table.ToList().FindAll(x =>
                        x.ConnectorSourceId == ConnectorSourceId &&
                        (
                            ((x.StartDate.Date >= searchInfo.StartDate.Value) && (x.EndDate <= searchInfo.EndDate.Value))
                            ||
                            ((x.StartDate.Date <= searchInfo.StartDate.Value) && (x.EndDate >= searchInfo.StartDate.Value))
                            ||
                            ((x.EndDate.Date >= searchInfo.EndDate.Value) && (x.StartDate <= searchInfo.EndDate.Value))

                        )
                            // join
                        && (string.IsNullOrEmpty(searchInfo.Name) || (!string.IsNullOrEmpty(x.Summary) && x.Summary.Contains(searchInfo.Name)))
                        && (string.IsNullOrEmpty(searchInfo.EventId) || (!string.IsNullOrEmpty(x.EventId) && x.EventId.CompareTo(searchInfo.EventId) == 0))
                        && (string.IsNullOrEmpty(searchInfo.Location) || (!string.IsNullOrEmpty(x.Location) && x.Location.Contains(searchInfo.Location)))
                        && (calendarId == null || (x.CalendarId == calendarId))
           ).ToList();

            return result;
        }

        /// <summary>
        /// Update or insert item belongs to condition
        /// </summary>
        /// <param name="events"></param>
        private void OperationEvent(List<Core.Domain.Event> events)
        {
            foreach (var item in events)
            {
                var testEvent = _eventRepository.Table.Any(e => e.EventId == item.EventId);
                if (!testEvent)
                    _eventRepository.Insert(item);
                else
                    _eventRepository.Update(item);

            }
        }

        /// <summary>
        /// Get all events by ConnectSourceID, delete then add new
        /// </summary>
        /// <param name="events"></param>
        /// <param name="ConnectorSourceType"></param>
        public void SaveEvents(List<Core.Domain.Event> events, int connectSourceId, int ConnectorSourceType)
        {
            List<InfoConn.Core.Domain.Event> eventdbs = _eventRepository.Table.Where(e => e.ConnectorSourceId == connectSourceId).ToList();
            foreach (InfoConn.Core.Domain.Event entity in eventdbs)
            {
                _eventRepository.Delete(entity);
            }
            foreach (InfoConn.Core.Domain.Event entity in events)
            {
                _eventRepository.Insert(entity);
            }            
        }

        public void UpdateConnectorSource(int sourceId, Core.Domain.CacheType cachType)
        {
            using (InfoConn.Data.DBML.InfoConnDBEntities context = new InfoConn.Data.DBML.InfoConnDBEntities())
            {
                InfoConn.Data.DBML.ConnectorSource source = context.ConnectorSources.Where(x => x.Id == sourceId).FirstOrDefault();
                if (source != null)
                {
                    switch (cachType)
                    {
                        case Core.Domain.CacheType.Short:
                            source.DoCacheUpdate_Short = false;
                            source.CacheLastUpdate_Short = DateTime.Now;
                            break;

                        case Core.Domain.CacheType.Medium:
                            source.DoCacheUpdate_Medium = false;
                            source.CacheLastUpdate_Medium = DateTime.Now;
                            break;
                        case Core.Domain.CacheType.Longer:
                            source.DoCacheUpdate_Longer = false;
                            source.CacheLastUpdate_Longer = DateTime.Now;
                            break;
                    }
                    context.SaveChanges();
                }

            }
        }
    }
}
