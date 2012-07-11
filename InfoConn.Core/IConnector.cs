using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using InfoConn.Core.Domain.DTO;
using InfoConn.Core.Domain;

namespace InfoConn.Core
{
    public interface IConnector
    {
        ConnectorSource Source{ get; set; }
        bool IsSourceSet { get; }      
        List<Event> GetEvents(SearchOption searchInfo);
        Event GetEvent(int userId, string eventId, string calendarId);

        string PostEvent(int userId, ConnectorSourceType connectorSourceType, Event postEventPara);
        bool DeleteEvent(int userId, string eventId, string calendarId);
        List<Calendar> GetCalendars();
        Calendar GetCalendar(string calendarId);
    }
}
