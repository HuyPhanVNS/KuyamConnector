using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace InfoConn.Core.Domain.DTO
{
   public class SearchOption
    {
        public ConnectorSourceType ConnectorSource { get; set; }
        private DateTime? _startDate,_endDate;

       /// <summary>
       /// File path to temp ics file
       /// </summary>
        public string ICSFilePath { get; set; }
        /// <summary>
        /// Filter by this list of event IDs. This is a comma-separated list of event IDs.
        /// </summary>
        public string EventId { get; set; }

       /// <summary>
       /// Input stream to ics file
       /// </summary>
        public System.IO.Stream ICSStream { get; set; }

        /// <summary>
        /// The profile that created the event
        /// containing id and name fields
        /// </summary>
        public object Owner { get; set; }

        /// <summary>
        /// The event title
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// The long-form description of the event
        /// </summary>
        public string Description { get; set; }

        /// <summary>
        /// The start time of the event, as you want it to be displayed
        /// </summary>
        public DateTime? StartDate
        {
            get {
                if (_startDate == DateTime.MinValue)
                    _startDate = null;
                return _startDate;
                }
            set { _startDate = value;  }
        }

        /// <summary>
        /// The end time of the event, as you want it to be displayed
        /// </summary>
        public DateTime? EndDate
        {
            get
            {
                if (_endDate == DateTime.MinValue)
                    _endDate = null;
                return _endDate;
            }
            set { _endDate = value; }

        }

        /// <summary>
        /// The location for this event
        /// </summary>
        public string Location { get; set; }

        /// <summary>
        /// The location of this event
        /// object containing one or more of the following fields: id, street, city, state, zip, country, latitude, and longitude fields
        /// </summary>
        public object Venue { get; set; }

        /// <summary>
        /// The visibility of this event
        ///  containing 'OPEN', 'CLOSED', or 'SECRET'
        /// </summary>
        public string Privacy { get; set; }

        /// <summary>
        /// The last time the event was updated
        /// </summary>
        public DateTime UpdateDate { get; set; }

        /// <summary>
        /// Filter by this RSVP status. The RSVP status should be one of the following strings:
        ///attending
        ///unsure
        ///declined
        ///not_replied
        /// </summary>
        public string RSVStatus { get; set; }
        /// <summary>
        /// Filter by events associated with a user with this uid.
        /// </summary>
        public int UId { get; set; }

       /// <summary>
       /// Get calendarId
       /// </summary>
        public string CalendarId { get; set; }

        /// <summary>
       /// Get,Set the connector source type
       /// </summary>
        public ConnectorSourceType ConnectorSourceType { get; set; }
    }
}
