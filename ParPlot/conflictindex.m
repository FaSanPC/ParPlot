
%Upload .csv data file
t = readtable('IMRR_data.csv');
totalData=t;

t.name=[];
t.group=[];

UM=table2array(t);

%Calculate kendall matrix

UM=UM';
m  = size(UM,1);
n  = size(UM,2);

KM = nan(m,n);

for i = 1:n
    idx_i   = [1:size(UM,2)] == i;
    KM(i,:) = corr(UM(:,i),UM,'type','Kendall');    
end   

Kendall=mean(KM,2);
Kendall=array2table(Kendall);
totalData=[totalData Kendall];

%Save Kendall Matrix
save KM.mat KM

%Save .csv data file with Kendall mean value
writetable(totalData,'totalData.csv');
