using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace InfoConn.Core.Exceptions
{
    public class ConnectorOperationNotSupportedException:ConnectorException
    {
        public ConnectorOperationNotSupportedException()
            :base("Operation is not supported.")
        {

        }
        public ConnectorOperationNotSupportedException(Type connectorType, string method, Exception innerException = null)
            :base(string.Format("The {0} method is not supported by the {1} connector.", connectorType.Name, method), innerException)
        {

        }
    }
}
