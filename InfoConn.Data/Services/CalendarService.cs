using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using InfoConn.Data;
using InfoConn.Core;
using InfoConn.Data.Respositories;

namespace InfoConn.Data.Services
{
    public class CalendarService : ICalendarService
    {
        public ICalendarRepository _calendarRepository { get; set; }

        public IEventRepository _eventRepository { get; set; }

        public CalendarService(ICalendarRepository calendarRepository)
        {
            this._calendarRepository = calendarRepository;
        }
        public CalendarService(ICalendarRepository calendarRepository, IEventRepository eventRepository)
        {
            this._calendarRepository = calendarRepository;
            this._eventRepository = eventRepository;
        }

        /// <summary>
        /// pdate or insert calendar belongs to condition
        /// </summary>
        /// <param name="calendars"></param>
        private void OperationCalendar(List<Core.Domain.Calendar> calendars)
        {
            foreach (var calendar in calendars)
            {
                var testCalendar = _calendarRepository.Table.FirstOrDefault(c => c.CalendarId == calendar.CalendarId && c.ConnectorSourceId == calendar.ConnectorSourceId);
                if (testCalendar != null)
                {
                    testCalendar.CalendarId = calendar.CalendarId;
                    testCalendar.ConnectorSourceId = calendar.ConnectorSourceId;
                    testCalendar.Description = calendar.Description;
                    testCalendar.Location = calendar.Location;
                    testCalendar.Summary = calendar.Summary;
                    _calendarRepository.Update(testCalendar);
                }
                else
                {
                    testCalendar = new Core.Domain.Calendar
                    {
                        CalendarId = calendar.CalendarId,
                        ConnectorSourceId = calendar.ConnectorSourceId,
                        Description = calendar.Description,
                        Location = calendar.Location,
                        Summary = calendar.Summary
                    };

                    _calendarRepository.Insert(testCalendar);
                }
            }
        }
        /// <summary>
        /// Insert, delete or update events belongs to list of calendar's event returned
        /// </summary>
        /// <param name="calendars"></param>
        public void SaveCalendars(List<Core.Domain.Calendar> calendars)
        {
            using (InfoConn.Data.DBML.InfoConnDBEntities context = new DBML.InfoConnDBEntities())
            {
                if (calendars.Count > 0)
                {
                    int connectorID = calendars[0].ConnectorSourceId;
                    List<InfoConn.Data.DBML.Calendar> lstCalendar = context.Calendars.Where(e => e.ConnectorSourceId == connectorID).ToList();
                    for (int i = lstCalendar.Count - 1; i >= 0; i--)
                    {
                        DBML.Calendar calendar = lstCalendar[i];
                        if (calendar.Events.Count > 0)
                        {
                            List<DBML.Event> lstEvent = calendar.Events.ToList();
                            for (int j = lstEvent.Count - 1; j >= 0; j--)
                            {
                                context.Events.DeleteObject(lstEvent[j]);
                            }
                        }
                        context.Calendars.DeleteObject(calendar);
                    }
                }                
                foreach (Core.Domain.Calendar cal in calendars)
                {
                    InfoConn.Data.DBML.Calendar newObj = new DBML.Calendar()
                    {                        
                        CalendarId = cal.CalendarId,
                        ConnectorSourceId  = cal.ConnectorSourceId,
                        Description = cal.Description,
                        Summary = cal.Summary,
                        Location = cal.Location
                    };
                    context.Calendars.AddObject(newObj);
                }
                context.SaveChanges();
            }                           
        }

        public List<Core.Domain.Calendar> GetCalendars(Core.Domain.ConnectorSource source)
        {
            return _calendarRepository.Table.Where(c => c.ConnectorSourceId == source.Id).ToList();
        }
    }
}
