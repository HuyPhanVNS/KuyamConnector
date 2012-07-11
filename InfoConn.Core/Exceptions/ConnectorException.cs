using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace InfoConn.Core.Exceptions
{
    public class ConnectorException : ApplicationException
    {
        public ConnectorException()
        {

        }
        public ConnectorException(string message)
            :base(message)
        {
            
        }

        public ConnectorException(string message, Exception innerException)
            : base(message, innerException)
        {

        }
    }
}
