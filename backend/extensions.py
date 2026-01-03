"""Flask extensions."""
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_session import Session

db = SQLAlchemy()
bcrypt = Bcrypt()
sess = Session()
