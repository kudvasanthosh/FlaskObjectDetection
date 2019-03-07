FROM python:2.7
WORKDIR /FlaskObjectDetection
COPY requirements.txt /FlaskObjectDetection
RUN pip install -r requirements.txt
COPY . /FlaskObjectDetection
EXPOSE 5000
CMD python app.py