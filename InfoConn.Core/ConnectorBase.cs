using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using InfoConn.Core.Domain.DTO;
using InfoConn.Core.Domain;

namespace InfoConn.Core
{
    public abstract class ConnectorBase : IConnector
    {

        public ConnectorSource Source
        {
            get;
            set;
        }

        public bool IsSourceSet
        {
            get { return Source != null; }
        }

        /// <summary>
        /// Set event source for connector
        /// </summary>
        /// <param name="source">Connector source that contain infomation to connect with calendar server</param>
        public virtual void Init(ConnectorSource source)
        {
            this.Source = source;
        }

        public abstract List<Event> GetEvents(SearchOption searchInfo);
        public abstract Event GetEvent(int userId, string eventId, string calendarId);
        public abstract string PostEvent(int userId, ConnectorSourceType connectorSourceType, Event postEventPara);
        public abstract List<Calendar> GetCalendars();
        public abstract bool DeleteEvent(int userId, string eventId, string calendarId);
        public abstract Calendar GetCalendar(string calendarId);

        
        public abstract void UpdateCache(int connectorSourceID, CacheType cacheType);
       

        public virtual bool SaveEvents(SearchOption searchInfo)
        {
            return true;
        }

        protected bool IsOutOfDate(DateTime? startDate, DateTime? endDate)
        {
            return true;
            //
            //if (endDate == null)
            //    return true;
            //else
            //{
            //    if (startDate == null)
            //    { 
            //        return Source.LastModified
            //    }
            //}

        }

       
    }
}
