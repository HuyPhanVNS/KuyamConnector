using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using InfoConn.Core.Domain;

namespace InfoConn.Data.Services
{
    public interface ICalendarService
    {
        void SaveCalendars(List<Core.Domain.Calendar> calendars);

        List<Calendar> GetCalendars(Core.Domain.ConnectorSource Source);
    }
}
