using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using InfoConn.Core;
using InfoConn.Core.Exceptions;
using InfoConn.Core.Domain.DTO;

namespace InfoConn.Connector.ICalendar
{
    public class ICalendarConnector : ConnectorBase
    {
        #region Contructor
        /// <summary>
        /// Contructor
        /// </summary>
        public ICalendarConnector(){}
        #endregion

        #region Method Overrided

        public override List<Event> GetEvents(Option searchInfo)
        {
            if (!IsSourceSet){
                throw new SourceNotSetException();
            }

            DDay.iCal.IICalendar iCal = DDay.iCal.iCalendar.LoadFromFile(Source.FeedUrl)[0];

            DateTime start = DateTime.Today.AddYears(-1);
            DateTime end = DateTime.Today.AddYears(1).AddSeconds(-1);

            if (searchInfo.StartDate != null && searchInfo.EndDate != null)
            {
                start = (DateTime)searchInfo.StartDate;
                end = (DateTime)searchInfo.EndDate;
            }

            IList<DDay.iCal.Occurrence> occurrences = iCal.GetOccurrences<DDay.iCal.IEvent>(start, end);

            var result = new List<InfoConn.Core.Event>();

            foreach (DDay.iCal.Occurrence o in occurrences){
                DDay.iCal.Event rc = o.Source as DDay.iCal.Event;
                result.Add(new InfoConn.Core.Event{
                    UId = rc.UID,
                    StartDate = DateTime.Parse(rc.Start.ToString()),
                    EndDate = DateTime.Parse(rc.End.ToString()),
                    Summary = rc.Summary,
                    Location = rc.Location,
                    Description = rc.Description
                });
            }

            return result;
        }
        public override Event GetEvent(int userId, string eventId)
        {
            throw new NotImplementedException();
        }
        public override List<Calendar> GetCalendars(params string[] minAccessRole)
        {
            throw new NotImplementedException();
        }
        public override bool DeleteEvent(int userId, string eventId)
        {
            throw new NotImplementedException();
        }
        public override string PostEvent(int userId, Option postOption)
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
        public void ExportCalendar(List<Event> eventList, string filePath){

            // Create an iCalendar.
            DDay.iCal.IICalendar iCal = new DDay.iCal.iCalendar();

            foreach (Event eventItem in eventList){
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
        }
        
        #endregion
    }
}
