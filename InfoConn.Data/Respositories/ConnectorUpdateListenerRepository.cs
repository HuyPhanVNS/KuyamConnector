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
    public class ConnectorUpdateListenerRepository : IConnectorUpdateListenerRepository
    {
       
        IDbContext _context;
        private IDbSet<ConnectorUpdateListener> _entities;

        private IDbSet<ConnectorUpdateListener> Entities
        {
            get
            {
                if (_entities == null)
                    _entities = _context.Set<ConnectorUpdateListener>();
                return _entities;
            }
        }

        public ConnectorUpdateListenerRepository(IDbContext context)
        {
            this._context = context;
        }
        public ConnectorUpdateListener GetById(object id)
        {
            return this.Entities.Find(id);

        }

        public void Insert(ConnectorUpdateListener entity)
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

        public void Update(ConnectorUpdateListener entity)
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

        public void Delete(ConnectorUpdateListener entity)
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

        public IQueryable<ConnectorUpdateListener> Table
        {
            get { return _context.Set<ConnectorUpdateListener>(); }
        }

        public void DeleteNotSubmit(ConnectorUpdateListener entity) { }
        public void InsertNotSubmit(ConnectorUpdateListener entity) { }
        public void Delete(List<ConnectorUpdateListener> entities) { }
        public void SummitChange() { }
    }
}
