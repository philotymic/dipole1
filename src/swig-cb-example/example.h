// -*- c++ -*-
//

class Callback{
public:
  virtual void run(int n);
  virtual ~Callback() {}; 
};   

class CallBacker {
  Callback* callback = 0;

public:
  void doSomeWithCallback();
  void setCallback(Callback * cb);
};

