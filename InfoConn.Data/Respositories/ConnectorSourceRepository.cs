using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using InfoConn.Core;
using System.Data.Entity;
using System.Data.Entity.Validation;
using InfoConn.Core.Domain;

namespace InfoConn.Data.Respositories
{
    public class ConnectorSourceRepository : IConnectorSourceRepository
    {
        IDbContext _context;
        private IDbSet<ConnectorSource> _entities;

        private IDbSet<ConnectorSource> Entities
        {
            get
            {
                if (_entities == null)
                    _entities = _context.Set<ConnectorSource>();
                return _entities;
            }
        }

        public ConnectorSourceRepository(IDbContext context)
        {
            this._context = context;
        }
        public ConnectorSource GetById(object id)
        {
            return this.Entities.Find(id);

        }

        public void Insert(ConnectorSource entity)
        {
            try
            {
                if (entity == null)
                    throw new ArgumentNullException("entity");

                this.Entities.Add(entity);

                this._context.SaveChanges();
            }
            catch (DbEntityValidationException dbEx)
            {
                var msg = string.Empty;

                foreach (var validationErrors in dbEx.EntityValidationErrors)
                    foreach (var validationError in validationErrors.ValidationErrors)
                        msg += string.Format("Property: {0} Error: {1}", validationError.PropertyName, validationError.ErrorMessage) + Environment.NewLine;

                var fail = new Exception(msg, dbEx);
                //Debug.WriteLine(fail.Message, fail);
                throw fail;
            }
        }

        public void Update(ConnectorSource entity)
        {
            try
            {
                if (entity == null)
                    throw new ArgumentNullException("entity");

                this._context.SaveChanges();                
            }
            catch (DbEntityValidationException dbEx)
            {
                var msg = string.Empty;

                foreach (var validationErrors in dbEx.EntityValidationErrors)
                    foreach (var validationError in validationErrors.ValidationErrors)
                        msg += Environment.NewLine + string.Format("Property: {0} Error: {1}", validationError.PropertyName, validationError.ErrorMessage);

                var fail = new Exception(msg, dbEx);
                //Debug.WriteLine(fail.Message, fail);
                throw fail;
            }
        }

        public void Delete(ConnectorSource entity)
        {
            try
            {
                if (entity == null)
                    throw new ArgumentNullException("entity");

                this.Entities.Remove(entity);

                this._context.SaveChanges();
            }
            catch (DbEntityValidationException dbEx)
            {
                var msg = string.Empty;

                foreach (var validationErrors in dbEx.EntityValidationErrors)
                    foreach (var validationError in validationErrors.ValidationErrors)
                        msg += Environment.NewLine + string.Format("Property: {0} Error: {1}", validationError.PropertyName, validationError.ErrorMessage);

                var fail = new Exception(msg, dbEx);
                //Debug.WriteLine(fail.Message, fail);
                throw fail;
            }
        }

        public IQueryable<ConnectorSource> Table
        {
            get { return _context.Set<ConnectorSource>(); }
        }

        public void DeleteNotSubmit(ConnectorSource entity) { }
        public void InsertNotSubmit(ConnectorSource entity) { }
        public void Delete(List<ConnectorSource> entities) { }
        public void SummitChange() { }
    }
}
